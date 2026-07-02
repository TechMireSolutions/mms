import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { sql, eq, like } from 'drizzle-orm';
import { join } from 'path';
import { loadServerConfig } from '../config/serverConfig.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { resolveBackendRoot } from '../config/loadEnv.js';
import { getMinimalCollectionsForSeed, getMinimalObjects } from './minimalSeeds.js';
import {
  WORKSPACES_COLLECTION,
  PLATFORM_SUPER_USERS_OBJECT_KEY,
  tenantCollectionKey,
  tenantObjectKey,
  parseTenantScopedStorageKey,
  isServerOnlyObjectKey,
  applyTitleCaseRecursive,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { runMigration001 } from './migrations/001_migrate_notification_settings.js';
import { runMigration002 } from './migrations/002_migrate_global_settings_fields.js';
import { runMigration003 } from './migrations/003_migrate_multi_tenant.js';
import { runMigration004 } from './migrations/004_seed_demo_teachers.js';
import { runMigration005 } from './migrations/005_normalize_teacher_contacts.js';
import { runMigration006 } from './migrations/006_normalize_contact_linked_collections.js';
import { runMigration007 } from './migrations/007_normalize_actor_user_links.js';
import { runMigration008 } from './migrations/008_backfill_login_email.js';
import { runMigration009 } from './migrations/009_seed_demo_students.js';
import { runMigration010 } from './migrations/010_seed_demo_teacher_contacts.js';
import { runMigration011 } from './migrations/011_expand_demo_roster.js';
import { runMigration012 } from './migrations/012_migrate_users_to_tables.js';
import { runMigration013 } from './migrations/013_seed_contact_config.js';
import { runMigration014 } from './migrations/014_seed_student_config.js';
import { runMigration015 } from './migrations/015_seed_teacher_config.js';
import { runMigration016 } from './migrations/016_seed_session_config.js';
import { runMigration017 } from './migrations/017_seed_attendance_config.js';
import { runMigration018 } from './migrations/018_seed_overdue_obligations.js';
import { runMigration019 } from './migrations/019_seed_question_bank.js';
import { runMigration020 } from './migrations/020_migrate_contacts_to_tables.js';
import { deleteTenantUsersByWorkspace, type TenantUserRow } from './repositories/tenantUserRepository.js';
import { deleteAuthArtifactsForWorkspace, purgeExpiredAuthArtifacts } from '../services/auth/authArtifactService.js';
import { ensurePlatformSuperUserFromEnv } from '../services/platform/platformUserService.js';
import { setDb } from './dbClient.js';

// ---------------------------------------------------------------------------
// Transaction propagation
// AsyncLocalStorage threads the active tx client through nested helper calls
// so that saveCollection / getCollection inside a transaction actually use it.
// ---------------------------------------------------------------------------
type DbClient = NodePgDatabase<typeof schema>;
const txStorage = new AsyncLocalStorage<DbClient>();

/** Returns the active transaction client if inside runInTransaction, otherwise the root db. */
function activeDb(): DbClient {
  return txStorage.getStore() ?? getRootDb();
}

function resolveCollectionStorageName(name: string): string {
  const tenant = getRequestTenant();
  if (!tenant || name === WORKSPACES_COLLECTION) return name;
  return tenantCollectionKey(tenant, name);
}

function resolveObjectStorageKey(key: string): string {
  const tenant = getRequestTenant();
  if (!tenant || key === PLATFORM_SUPER_USERS_OBJECT_KEY) return key;
  return tenantObjectKey(tenant, key);
}

let pool: pg.Pool;
let _rootDb: DbClient;

function getRootDb(): DbClient {
  if (!_rootDb) throw new Error('Database not initialized');
  return _rootDb;
}

export async function initDb(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mms';

    pool = new pg.Pool({
      connectionString,
      max: loadServerConfig().pgPoolMax,
    });

    _rootDb = drizzle(pool, { schema });
    setDb(_rootDb);

    // Run Drizzle migrations dynamically on start
    const migrationsFolder = join(resolveBackendRoot(), 'src/db/migrations_drizzle');
    await migrate(_rootDb, { migrationsFolder });

    // Run pending data migrations — failures are fatal and halt startup
    const dataMigrationsToRun = [
      { id: '001', run: runMigration001 },
      { id: '002', run: runMigration002 },
      { id: '003', run: runMigration003 },
      { id: '004', run: runMigration004 },
      { id: '005', run: runMigration005 },
      { id: '006', run: runMigration006 },
      { id: '007', run: runMigration007 },
      { id: '008', run: runMigration008 },
      { id: '009', run: runMigration009 },
      { id: '010', run: runMigration010 },
      { id: '011', run: runMigration011 },
      { id: '012', run: runMigration012 },
      { id: '013', run: runMigration013 },
      { id: '014', run: runMigration014 },
      { id: '015', run: runMigration015 },
      { id: '016', run: runMigration016 },
      { id: '017', run: runMigration017 },
      { id: '018', run: runMigration018 },
      { id: '019', run: runMigration019 },
      { id: '020', run: runMigration020 },
    ];

    const applied = await _rootDb.select().from(schema.dataMigrations);
    const appliedSet = new Set(applied.map((m) => m.id));

    for (const migration of dataMigrationsToRun) {
      if (!appliedSet.has(migration.id)) {
        console.log(`[Data Migration] Running pending data migration ${migration.id}...`);
        await migration.run();
        await _rootDb.insert(schema.dataMigrations).values({ id: migration.id });
      }
    }
    await purgeExpiredAuthArtifacts();
    await ensurePlatformSuperUserFromEnv();

    const results = await _rootDb.select({ count: sql<number>`count(*)` }).from(schema.collections);
    const count = Number(results[0]?.count ?? 0);

    if (count === 0) {
      console.log('Database is empty. Seeding default collections and objects...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('Failed to initialize the database:', error);
    throw error;
  }
}

export async function seedDatabase(): Promise<void> {
  try {
    await runInTransaction(async () => {
      for (const [name, collectionItems] of Object.entries(await getMinimalCollectionsForSeed())) {
        await saveCollection(name, collectionItems as unknown[]);
      }
      for (const [key, objectValue] of Object.entries(getMinimalObjects())) {
        await saveObject(key, objectValue);
      }
    });
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed the database:', error);
    throw error;
  }
}

export async function getCollection(name: string): Promise<unknown[] | null> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const rows = await activeDb().select().from(schema.collections).where(eq(schema.collections.name, storageName));
    const row = rows[0];
    if (!row) return null;
    return JSON.parse(row.data) as unknown[];
  } catch (error) {
    console.error(`Error getting collection "${name}":`, error);
    throw error;
  }
}

export async function saveCollection(name: string, data: unknown[]): Promise<void> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const processedData = applyTitleCaseRecursive(data) as unknown[];
    const serialized = JSON.stringify(processedData);
    await activeDb().insert(schema.collections)
      .values({ name: storageName, data: serialized })
      .onConflictDoUpdate({
        target: schema.collections.name,
        set: { data: serialized },
      });

    const parsed = parseTenantScopedStorageKey(storageName);
    if (parsed && parsed.logicalKey === 'users') {
      const { replaceTenantUsersForWorkspace } = await import('./repositories/tenantUserRepository.js');
      await replaceTenantUsersForWorkspace(parsed.subdomain, processedData as TenantUserRow[]);
    } else if (parsed && parsed.logicalKey === 'contacts') {
      const { replaceContactsForWorkspace } = await import('./repositories/contactRepository.js');
      await replaceContactsForWorkspace(parsed.subdomain, processedData as import('@mms/shared').Contact[]);
    }
  } catch (error) {
    console.error(`Error saving collection "${name}":`, error);
    throw error;
  }
}

export async function getObject(key: string): Promise<unknown | null> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const rows = await activeDb().select().from(schema.objects).where(eq(schema.objects.key, storageKey));
    const row = rows[0];
    if (!row) return null;
    return JSON.parse(row.data) as unknown;
  } catch (error) {
    console.error(`Error getting object "${key}":`, error);
    throw error;
  }
}

export async function saveObject(key: string, data: unknown): Promise<void> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const processedData = applyTitleCaseRecursive(data);
    const serialized = JSON.stringify(processedData);
    await activeDb().insert(schema.objects)
      .values({ key: storageKey, data: serialized })
      .onConflictDoUpdate({
        target: schema.objects.key,
        set: { data: serialized },
      });
  } catch (error) {
    console.error(`Error saving object "${key}":`, error);
    throw error;
  }
}

/** Deletes a tenant-scoped object by logical key. */
export async function deleteObject(key: string): Promise<void> {
  const storageKey = resolveObjectStorageKey(key);
  await deleteObjectByStorageKey(storageKey);
}

export async function getAllData(): Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }> {
  try {
    const tenant = getRequestTenant();
    const collections: Record<string, unknown[]> = {};
    const colRows = await activeDb().select().from(schema.collections);
    for (const row of colRows) {
      if (row.name === WORKSPACES_COLLECTION) continue;
      const parsed = parseTenantScopedStorageKey(row.name);
      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        collections[parsed.logicalKey] = JSON.parse(row.data) as unknown[];
      } else if (!parsed) {
        collections[row.name] = JSON.parse(row.data) as unknown[];
      }
    }

    const objects: Record<string, unknown> = {};
    const objRows = await activeDb().select().from(schema.objects);
    for (const row of objRows) {
      const parsed = parseTenantScopedStorageKey(row.key);
      const logicalKey = parsed?.logicalKey ?? row.key;
      if (isServerOnlyObjectKey(logicalKey)) continue;

      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        objects[parsed.logicalKey] = JSON.parse(row.data) as unknown;
      } else if (!parsed) {
        objects[row.key] = JSON.parse(row.data) as unknown;
      }
    }

    return { collections, objects };
  } catch (error) {
    console.error('Error retrieving all database data:', error);
    throw error;
  }
}

/**
 * Deletes all SQLite rows scoped to a workspace subdomain (collections, objects, tenant users).
 * Uses LIKE prefix batch deletes instead of per-row sequential deletes.
 * Does not modify the global workspaces registry.
 */
export async function purgeTenantDataBySubdomain(subdomain: string): Promise<void> {
  const tenant = subdomain.trim().toLowerCase();
  if (!tenant) {
    throw new Error('Subdomain is required to purge tenant data');
  }

  const prefix = `t:${tenant}:`;
  const db = activeDb();

  await db.delete(schema.collections).where(like(schema.collections.name, `${prefix}%`));
  await db.delete(schema.objects).where(like(schema.objects.key, `${prefix}%`));
  await deleteTenantUsersByWorkspace(tenant);
  const { deleteContactsByWorkspace } = await import('./repositories/contactRepository.js');
  await deleteContactsByWorkspace(tenant);
  await deleteAuthArtifactsForWorkspace(tenant);
}

/**
 * Resets only the current tenant's data and reseeds minimal defaults.
 */
export async function resetTenantData(): Promise<void> {
  const tenant = getRequestTenant();
  if (!tenant) {
    throw new Error('Tenant context is required to reset workspace data');
  }

  await purgeTenantDataBySubdomain(tenant);

  const collections = await getMinimalCollectionsForSeed();
  for (const [name, collectionItems] of Object.entries(collections)) {
    if (name === WORKSPACES_COLLECTION) continue;
    await saveCollection(name, collectionItems as unknown[]);
  }
  for (const [key, objectValue] of Object.entries(getMinimalObjects())) {
    await saveObject(key, objectValue);
  }
}

/**
 * Resets the entire database schema and reseeds the default data.
 * Tables are dropped in dependency-safe order.
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = activeDb();
    await db.execute(sql`DROP TABLE IF EXISTS tenant_users CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS platform_users CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS auth_artifacts CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS collections CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS objects CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS data_migrations CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE;`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    await initDb();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/** Lists all collection storage names (including tenant-prefixed). */
export async function listCollectionStorageNames(): Promise<string[]> {
  const colRows = await activeDb().select({ name: schema.collections.name }).from(schema.collections);
  return colRows.map((row) => row.name);
}

/** Reads a collection by exact storage name (no tenant prefixing). */
export async function getCollectionByStorageName(name: string): Promise<unknown[] | null> {
  const rows = await activeDb().select().from(schema.collections).where(eq(schema.collections.name, name));
  const row = rows[0];
  if (!row) return null;
  return JSON.parse(row.data) as unknown[];
}

/** Deletes a collection row by exact storage name. */
export async function deleteCollectionByStorageName(name: string): Promise<void> {
  await activeDb().delete(schema.collections).where(eq(schema.collections.name, name));
}

/** Deletes an object row by exact storage key. */
export async function deleteObjectByStorageKey(key: string): Promise<void> {
  await activeDb().delete(schema.objects).where(eq(schema.objects.key, key));
}

/** Lists all object storage keys (including tenant-prefixed). */
export async function listObjectStorageKeys(): Promise<string[]> {
  const objRows = await activeDb().select({ key: schema.objects.key }).from(schema.objects);
  return objRows.map((row) => row.key);
}

/** Reads an object by exact storage key (no tenant prefixing). */
export async function getObjectByStorageKey(key: string): Promise<unknown | null> {
  const rows = await activeDb().select().from(schema.objects).where(eq(schema.objects.key, key));
  const row = rows[0];
  if (!row) return null;
  return JSON.parse(row.data) as unknown;
}

/** Lightweight DB connectivity check for `/ready`. */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (!pool) return false;
    await _rootDb.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

/** Gracefully close the database on shutdown. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

/**
 * Runs a callback within a database transaction.
 * Uses AsyncLocalStorage to propagate the tx client to all nested helper calls
 * so they participate in the same transaction rather than the root connection.
 * Nested calls are no-ops (they reuse the active tx).
 */
export async function runInTransaction<T>(cb: () => Promise<T>): Promise<T> {
  const existing = txStorage.getStore();
  if (existing) return cb();

  return await _rootDb.transaction(async (tx) => {
    return await txStorage.run(tx, cb);
  });
}
