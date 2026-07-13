import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { sql, eq, like, and } from 'drizzle-orm';
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
import { runMigration021 } from './migrations/021_migrate_custom_tabs.js';
import { runMigration022 } from './migrations/022_migrate_students_to_tables.js';
import { runMigration023 } from './migrations/023_migrate_teachers_to_tables.js';
import { runMigration024 } from './migrations/024_migrate_sessions_to_tables.js';
import { runMigration025 } from './migrations/025_migrate_attendance_to_tables.js';
import { runMigration026 } from './migrations/026_migrate_enrollments_to_tables.js';
import { runMigration027 } from './migrations/027_migrate_obligations_to_tables.js';
import { runMigration028 } from './migrations/028_migrate_finance_to_tables.js';
import { runMigration029 } from './migrations/029_migrate_examinations_to_tables.js';
import { runMigration030 } from './migrations/030_migrate_hasanat_to_tables.js';
import { runMigration031 } from './migrations/031_migrate_accounting_to_tables.js';
import { runMigration032 } from './migrations/032_migrate_question_bank_to_tables.js';
import { runMigration033 } from './migrations/033_migrate_logs_to_tables.js';
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
const DATA_MIGRATION_LOCK_KEY = 2145836401;

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
      { id: '021', run: runMigration021 },
      { id: '022', run: runMigration022 },
      { id: '023', run: runMigration023 },
      { id: '024', run: runMigration024 },
      { id: '025', run: runMigration025 },
      { id: '026', run: runMigration026 },
      { id: '027', run: runMigration027 },
      { id: '028', run: runMigration028 },
      { id: '029', run: runMigration029 },
      { id: '030', run: runMigration030 },
      { id: '031', run: runMigration031 },
      { id: '032', run: runMigration032 },
      { id: '033', run: runMigration033 },
    ];

    const migrationLockClient = await pool.connect();
    try {
      await migrationLockClient.query('select pg_advisory_lock($1::integer)', [DATA_MIGRATION_LOCK_KEY]);

      const applied = await _rootDb.select().from(schema.dataMigrations);
      const appliedSet = new Set(applied.map((m) => m.id));

      for (const migration of dataMigrationsToRun) {
        if (!appliedSet.has(migration.id)) {
          console.log(`[Data Migration] Running pending data migration ${migration.id}...`);
          await migration.run();
          await _rootDb.insert(schema.dataMigrations).values({ id: migration.id }).onConflictDoNothing();
          appliedSet.add(migration.id);
        }
      }
    } finally {
      await migrationLockClient.query('select pg_advisory_unlock($1::integer)', [DATA_MIGRATION_LOCK_KEY]).catch(() => undefined);
      migrationLockClient.release();
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
    return row.data;
  } catch (error) {
    console.error(`Error getting collection "${name}":`, error);
    throw error;
  }
}

export async function getCollectionForUpdate(name: string): Promise<unknown[] | null> {
  try {
    const storageName = resolveCollectionStorageName(name);
    await activeDb().insert(schema.collections)
      .values({ name: storageName, data: [] })
      .onConflictDoNothing();
    const result = await activeDb().execute(sql`
      SELECT data
      FROM collections
      WHERE name = ${storageName}
      FOR UPDATE
    `);
    const row = getQueryRows<{ data: unknown[] }>(result)[0];
    return row?.data ?? null;
  } catch (error) {
    console.error(`Error locking collection "${name}":`, error);
    throw error;
  }
}

export async function saveCollection(name: string, data: unknown[]): Promise<void> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const processedData = applyTitleCaseRecursive(data) as unknown[];
    await activeDb().insert(schema.collections)
      .values({ name: storageName, data: processedData })
      .onConflictDoUpdate({
        target: schema.collections.name,
        set: { data: processedData },
      });

    const parsed = parseTenantScopedStorageKey(storageName);
    if (parsed) {
      const REPO_MAPPING: Record<string, { importPath: string; fnName: string }> = {
        users: { importPath: './repositories/tenantUserRepository.js', fnName: 'replaceTenantUsersForWorkspace' },
        contacts: { importPath: './repositories/contactRepository.js', fnName: 'replaceContactsForWorkspace' },
        students: { importPath: './repositories/studentRepository.js', fnName: 'replaceStudentsForWorkspace' },
        teachers: { importPath: './repositories/teacherRepository.js', fnName: 'replaceTeachersForWorkspace' },
        sessions: { importPath: './repositories/sessionRepository.js', fnName: 'replaceSessionsForWorkspace' },
        attendance_records: { importPath: './repositories/attendanceRepository.js', fnName: 'replaceAttendanceRecordsForWorkspace' },
        enrollments: { importPath: './repositories/enrollmentRepository.js', fnName: 'replaceEnrollmentsForWorkspace' },
        obligation_types: { importPath: './repositories/obligationRepository.js', fnName: 'replaceObligationTypesForWorkspace' },
        mujtahids: { importPath: './repositories/obligationRepository.js', fnName: 'replaceMujtahidsForWorkspace' },
        mujtahid_reps: { importPath: './repositories/obligationRepository.js', fnName: 'replaceMujtahidRepsForWorkspace' },
        wakala_types: { importPath: './repositories/obligationRepository.js', fnName: 'replaceWakalaTypesForWorkspace' },
        obligation_distributions: { importPath: './repositories/obligationRepository.js', fnName: 'replaceObligationDistributionsForWorkspace' },
        obligation_collections: { importPath: './repositories/obligationRepository.js', fnName: 'replaceObligationCollectionsForWorkspace' },
        finance_invoices: { importPath: './repositories/financeRepository.js', fnName: 'replaceInvoicesForWorkspace' },
        finance_payments: { importPath: './repositories/financeRepository.js', fnName: 'replacePaymentsForWorkspace' },
        exams: { importPath: './repositories/examinationRepository.js', fnName: 'replaceExamsForWorkspace' },
        exam_results: { importPath: './repositories/examinationRepository.js', fnName: 'replaceExamResultsForWorkspace' },
        hasanat_denoms: { importPath: './repositories/hasanatRepository.js', fnName: 'replaceDenomsForWorkspace' },
        hasanat_batches: { importPath: './repositories/hasanatRepository.js', fnName: 'replaceBatchesForWorkspace' },
        hasanat_distributions: { importPath: './repositories/hasanatRepository.js', fnName: 'replaceDistributionsForWorkspace' },
        hasanat_redemptions: { importPath: './repositories/hasanatRepository.js', fnName: 'replaceRedemptionsForWorkspace' },
        accounting_accounts: { importPath: './repositories/accountingRepository.js', fnName: 'replaceAccountsForWorkspace' },
        accounting_entries: { importPath: './repositories/accountingRepository.js', fnName: 'replaceEntriesForWorkspace' },
        accounting_fiscal_years: { importPath: './repositories/accountingRepository.js', fnName: 'replaceFiscalYearsForWorkspace' },
        questions: { importPath: './repositories/questionBankRepository.js', fnName: 'replaceQuestionsForWorkspace' },
        tests: { importPath: './repositories/questionBankRepository.js', fnName: 'replaceTestsForWorkspace' },
        assessment_results: { importPath: './repositories/questionBankRepository.js', fnName: 'replaceResultsForWorkspace' },
        user_activity_logs: { importPath: './repositories/logsRepository.js', fnName: 'replaceActivityLogsForWorkspace' },
        audit_log: { importPath: './repositories/logsRepository.js', fnName: 'replaceAuditLogEntriesForWorkspace' },
      };

      const mapping = REPO_MAPPING[parsed.logicalKey];
      if (mapping) {
        const repoModule = await import(mapping.importPath);
        const replaceFn = repoModule[mapping.fnName];
        if (typeof replaceFn === 'function') {
          await replaceFn(parsed.subdomain, processedData);
        }
      }
    }


    const tenant = getRequestTenant();
    if (tenant) {
      const { broadcastTenantUpdate } = await import('../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'collection', name);
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
    // Deprecated database-level hydration for custom tabs (handled by client REST calls)
    return row.data;
  } catch (error) {
    console.error(`Error getting object "${key}":`, error);
    throw error;
  }
}

export async function saveObject(key: string, data: unknown): Promise<void> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const tenant = getRequestTenant();
    const processedData = applyTitleCaseRecursive(data);
    // Deprecated database-level custom tabs extraction (handled by client REST calls)
    await activeDb().insert(schema.objects)
      .values({ key: storageKey, data: processedData })
      .onConflictDoUpdate({
        target: schema.objects.key,
        set: { data: processedData },
      });

    if (tenant) {
      const { broadcastTenantUpdate } = await import('../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'object', key);
    }
  } catch (error) {
    console.error(`Error saving object "${key}":`, error);
    throw error;
  }
}

/** Deletes a tenant-scoped object by logical key. */
export async function deleteObject(key: string): Promise<void> {
  const storageKey = resolveObjectStorageKey(key);
  await deleteObjectByStorageKey(storageKey);
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('../services/websocketService.js');
    broadcastTenantUpdate(tenant, 'object', key);
  }
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
        collections[parsed.logicalKey] = row.data;
      } else if (!parsed) {
        collections[row.name] = row.data;
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
        // Deprecated database-level hydration for custom tabs (handled by client REST calls)
        objects[parsed.logicalKey] = row.data;
      } else if (!parsed) {
        objects[row.key] = row.data;
      }
    }

    return { collections, objects };
  } catch (error) {
    console.error('Error retrieving all database data:', error);
    throw error;
  }
}

function getQueryRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

async function deleteTenantRowsByColumn(columnName: 'workspace_subdomain' | 'tenant_id', tenant: string): Promise<void> {
  const db = activeDb();
  const result = await db.execute(sql`
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = ${columnName}
  `);
  const rows = getQueryRows<{ table_name: string }>(result);

  for (const row of rows) {
    await db.execute(sql`
      DELETE FROM ${sql.raw(`"${row.table_name.replaceAll('"', '""')}"`)}
      WHERE ${sql.raw(`"${columnName}"`)} = ${tenant}
    `);
  }
}

/**
 * Deletes all database rows scoped to a workspace subdomain.
 * Does not modify the global workspaces registry; platform deletion removes that separately.
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
  await deleteTenantRowsByColumn('tenant_id', tenant);
  await deleteTenantRowsByColumn('workspace_subdomain', tenant);
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
  return row.data;
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
  return row.data;
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

const CONFIG_KEY_TO_MODULE: Record<string, string> = {
  'contact_field_config': 'contacts',
  'students_settings': 'students',
  'teachers_settings': 'teachers',
  'sessions_settings': 'sessions',
  'attendance_settings': 'attendance',
  'enrollments_settings': 'enrollment',
  'finance_settings': 'finance',
  'obligations_settings': 'obligations',
  'accounting_settings': 'accounting',
  'hasanat_settings': 'hasanat',
  'examinations_settings': 'examination',
  'question_bank_settings': 'questionBank',
  'users_settings': 'users',
};

interface CustomTabInput {
  key: string;
  label: string;
  icon?: string | null;
  enabled?: boolean;
  order?: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

async function _hydrateObjectData(key: string, data: unknown, tenant: string): Promise<unknown> {
  const moduleId = CONFIG_KEY_TO_MODULE[key];
  if (!moduleId || !data || typeof data !== 'object') return data;

  const dataObj = data as Record<string, unknown>;

  const tabRows = await activeDb()
    .select()
    .from(schema.customTabs)
    .where(
      and(
        eq(schema.customTabs.workspaceSubdomain, tenant),
        eq(schema.customTabs.moduleId, moduleId)
      )
    )
    .orderBy(schema.customTabs.sortOrder);

  const formTabs = tabRows.map(row => ({
    key: row.key,
    label: row.label,
    icon: row.icon ?? undefined,
    enabled: row.enabled,
    order: row.sortOrder,
    permissions: (row.permissions as string[]) ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem,
  }));

  return { ...dataObj, formTabs };
}

async function _saveCustomTabsForObject(key: string, data: unknown, tenant: string): Promise<unknown> {
  const moduleId = CONFIG_KEY_TO_MODULE[key];
  if (!moduleId || !data || typeof data !== 'object') return data;

  const dataObj = data as Record<string, unknown>;
  const formTabs = dataObj.formTabs;
  const cleanedData = { ...dataObj };
  delete cleanedData.formTabs;

  await activeDb()
    .delete(schema.customTabs)
    .where(
      and(
        eq(schema.customTabs.workspaceSubdomain, tenant),
        eq(schema.customTabs.moduleId, moduleId)
      )
    );

  if (Array.isArray(formTabs) && formTabs.length > 0) {
    const values = formTabs.map((tabRaw: unknown, idx: number) => {
      const tab = tabRaw as CustomTabInput;
      return {
        id: `${tenant}:${moduleId}:${tab.key}`,
        workspaceSubdomain: tenant,
        moduleId,
        key: tab.key,
        label: tab.label,
        icon: tab.icon || null,
        enabled: tab.enabled !== false,
        sortOrder: tab.order ?? idx,
        permissions: tab.permissions || null,
        description: tab.description || null,
        color: tab.color || null,
        isSystem: tab.isSystem === true,
      };
    });

    await activeDb().insert(schema.customTabs).values(values);
  }

  return cleanedData;
}
