import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { sql, eq } from 'drizzle-orm';
import { join } from 'path';
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
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { runMigration001 } from './migrations/001_migrate_notification_settings.js';
import { runMigration002 } from './migrations/002_migrate_global_settings_fields.js';
import { runMigration003 } from './migrations/003_migrate_multi_tenant.js';
import { purgeExpiredAuthArtifacts } from '../services/auth/authArtifactService.js';
import { ensurePlatformSuperUserFromEnv } from '../services/platform/platformUserService.js';
import { setDb } from './dbClient.js';

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

const { Pool } = pg;

let pool: pg.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

/**
 * Initializes the PostgreSQL database, creates the necessary schema,
 * and seeds default data if the database is empty.
 *
 * @returns {Promise<void>}
 */
export async function initDb(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mms';
    
    pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX) || 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    
    db = drizzle(pool, { schema });
    setDb(db);

    // Run Drizzle migrations dynamically on start
    const migrationsFolder = join(resolveBackendRoot(), 'src/db/migrations_drizzle');
    await migrate(db, { migrationsFolder });

    // Run pending data migrations — failures are fatal and halt startup
    await runMigration001();
    await runMigration002();
    await runMigration003();
    await purgeExpiredAuthArtifacts();
    await ensurePlatformSuperUserFromEnv();

    // Check if seeding is necessary (if no collections exist)
    const results = await db.select({ count: sql<number>`count(*)` }).from(schema.collections);
    const count = results[0]?.count ?? 0;

    if (count === 0) {
      console.log('Database is empty. Seeding default collections and objects...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('Failed to initialize the database:', error);
    throw error;
  }
}

/**
 * Seeds the database with default collections and objects.
 *
 * @returns {Promise<void>}
 */
export async function seedDatabase(): Promise<void> {
  try {
    // Seed using a transaction block for performance
    await runInTransaction(async () => {
      // Seed collections
      for (const [name, data] of Object.entries(await getMinimalCollectionsForSeed())) {
        await saveCollection(name, data as unknown[]);
      }

      // Seed objects
      for (const [key, data] of Object.entries(getMinimalObjects())) {
        await saveObject(key, data);
      }
    });
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed the database:', error);
    throw error;
  }
}

/**
 * Retrieves a collection by name.
 *
 * @param {string} name - The collection name.
 * @returns {Promise<unknown[] | null>} The array of objects in the collection, or null if not found.
 */
export async function getCollection(name: string): Promise<unknown[] | null> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const rows = await db.select().from(schema.collections).where(eq(schema.collections.name, storageName));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as unknown[];
  } catch (error) {
    console.error(`Error getting collection "${name}":`, error);
    throw error;
  }
}

/**
 * Saves/overwrites a collection.
 *
 * @param {string} name - The collection name.
 * @param {unknown[]} data - The data array to store.
 * @returns {Promise<void>}
 */
export async function saveCollection(name: string, data: unknown[]): Promise<void> {
  try {
    const storageName = resolveCollectionStorageName(name);
    await db.insert(schema.collections)
      .values({ name: storageName, data: JSON.stringify(data) })
      .onConflictDoUpdate({
        target: schema.collections.name,
        set: { data: JSON.stringify(data) }
      });
  } catch (error) {
    console.error(`Error saving collection "${name}":`, error);
    throw error;
  }
}

/**
 * Retrieves a single object by key.
 *
 * @param {string} key - The object key.
 * @returns {Promise<unknown | null>} The parsed object, or null if not found.
 */
export async function getObject(key: string): Promise<unknown | null> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const rows = await db.select().from(schema.objects).where(eq(schema.objects.key, storageKey));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as unknown;
  } catch (error) {
    console.error(`Error getting object "${key}":`, error);
    throw error;
  }
}

/**
 * Saves/overwrites a single object.
 *
 * @param {string} key - The object key.
 * @param {unknown} data - The object data to store.
 * @returns {Promise<void>}
 */
export async function saveObject(key: string, data: unknown): Promise<void> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    await db.insert(schema.objects)
      .values({ key: storageKey, data: JSON.stringify(data) })
      .onConflictDoUpdate({
        target: schema.objects.key,
        set: { data: JSON.stringify(data) }
      });
  } catch (error) {
    console.error(`Error saving object "${key}":`, error);
    throw error;
  }
}

/**
 * Retrieves all collections and objects for bulk synchronization.
 *
 * @returns {Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }>}
 */
export async function getAllData(): Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }> {
  try {
    const tenant = getRequestTenant();
    const collections: Record<string, unknown[]> = {};
    const colRows = await db.select().from(schema.collections);
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
    const objRows = await db.select().from(schema.objects);
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
 * Resets only the current tenant's data and reseeds minimal defaults.
 * Requires tenant context from the request host.
 */
export async function resetTenantData(): Promise<void> {
  const tenant = getRequestTenant();
  if (!tenant) {
    throw new Error('Tenant context is required to reset workspace data');
  }

  const colRows = await listCollectionStorageNames();
  for (const name of colRows) {
    const parsed = parseTenantScopedStorageKey(name);
    if (parsed?.subdomain === tenant) {
      await deleteCollectionByStorageName(name);
    }
  }

  const objKeys = await listObjectStorageKeys();
  for (const key of objKeys) {
    const parsed = parseTenantScopedStorageKey(key);
    if (parsed?.subdomain === tenant) {
      await deleteObjectByStorageKey(key);
    }
  }

  const collections = await getMinimalCollectionsForSeed();
  for (const [name, data] of Object.entries(collections)) {
    if (name === WORKSPACES_COLLECTION) continue;
    await saveCollection(name, data as unknown[]);
  }
  for (const [key, data] of Object.entries(getMinimalObjects())) {
    await saveObject(key, data);
  }
}

/**
 * Resets the entire database schema and reseeds the default data.
 *
 * @returns {Promise<void>}
 */
export async function resetDatabase(): Promise<void> {
  try {
    // Design Boundary Constraint: Drizzle ORM does not support dynamic schema teardown / dropping tables 
    // at runtime via type-safe query builders. Therefore, administrative DROP statements must execute raw SQL.
    await db.execute(sql`DROP TABLE IF EXISTS collections;`);
    await db.execute(sql`DROP TABLE IF EXISTS objects;`);
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations;`);
    await initDb();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Runs a callback within a database transaction block.
 *
 * @template T
 * @param {() => Promise<T>} cb - The callback containing operations to run.
 * @returns {Promise<T>} The result of the callback.
 */
/** Lists all collection storage names (including tenant-prefixed). */
export async function listCollectionStorageNames(): Promise<string[]> {
  const colRows = await db.select({ name: schema.collections.name }).from(schema.collections);
  return colRows.map((row) => row.name);
}

/** Reads a collection by exact storage name (no tenant prefixing). */
export async function getCollectionByStorageName(name: string): Promise<unknown[] | null> {
  const rows = await db.select().from(schema.collections).where(eq(schema.collections.name, name));
  const row = rows[0];
  if (!row) return null;
  return JSON.parse(row.data) as unknown[];
}

/** Deletes a collection row by exact storage name. */
export async function deleteCollectionByStorageName(name: string): Promise<void> {
  await db.delete(schema.collections).where(eq(schema.collections.name, name));
}

/** Deletes an object row by exact storage key. */
export async function deleteObjectByStorageKey(key: string): Promise<void> {
  await db.delete(schema.objects).where(eq(schema.objects.key, key));
}

/** Lists all object storage keys (including tenant-prefixed). */
export async function listObjectStorageKeys(): Promise<string[]> {
  const objRows = await db.select({ key: schema.objects.key }).from(schema.objects);
  return objRows.map((row) => row.key);
}

/** Reads an object by exact storage key (no tenant prefixing). */
export async function getObjectByStorageKey(key: string): Promise<unknown | null> {
  const rows = await db.select().from(schema.objects).where(eq(schema.objects.key, key));
  const row = rows[0];
  if (!row) return null;
  return JSON.parse(row.data) as unknown;
}

/** Lightweight DB connectivity check for `/ready`. */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (!pool) return false;
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** Gracefully close the PostgreSQL pool on shutdown. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

export async function runInTransaction<T>(cb: () => Promise<T>): Promise<T> {
  try {
    return await db.transaction(async () => {
      return await cb();
    });
  } catch (error) {
    console.error('Database transaction rolled back due to error:', error);
    throw error;
  }
}
