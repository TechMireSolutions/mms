import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolveBackendRoot } from '../config/loadEnv.js';
import { purgeExpiredAuthArtifacts } from '../services/auth/authArtifactService.js';
import { initPlatformSettings } from '../services/platform/platformSettingsService.js';
import { ensurePlatformSuperUserFromEnv } from '../services/platform/platformUserService.js';
import {
  getPool,
  getRootDb,
  initializeDatabaseConnection,
  runInTransaction,
} from './dbConnection.js';
import { saveCollection, saveObject } from './documentStore.js';
import { getMinimalCollectionsForSeed, getMinimalObjects } from './minimalSeeds.js';
import * as schema from './schema.js';

const DATA_MIGRATION_LOCK_KEY = 2145836401;

const dataMigrationsToRun = [
  { id: '001', load: async () => (await import('./migrations/001_migrate_notification_settings.js')).runMigration001 },
  { id: '002', load: async () => (await import('./migrations/002_migrate_global_settings_fields.js')).runMigration002 },
  { id: '003', load: async () => (await import('./migrations/003_migrate_multi_tenant.js')).runMigration003 },
  { id: '004', load: async () => (await import('./migrations/004_seed_demo_teachers.js')).runMigration004 },
  { id: '005', load: async () => (await import('./migrations/005_normalize_teacher_contacts.js')).runMigration005 },
  { id: '006', load: async () => (await import('./migrations/006_normalize_contact_linked_collections.js')).runMigration006 },
  { id: '007', load: async () => (await import('./migrations/007_normalize_actor_user_links.js')).runMigration007 },
  { id: '008', load: async () => (await import('./migrations/008_backfill_login_email.js')).runMigration008 },
  { id: '009', load: async () => (await import('./migrations/009_seed_demo_students.js')).runMigration009 },
  { id: '010', load: async () => (await import('./migrations/010_seed_demo_teacher_contacts.js')).runMigration010 },
  { id: '011', load: async () => (await import('./migrations/011_expand_demo_roster.js')).runMigration011 },
  { id: '012', load: async () => (await import('./migrations/012_migrate_users_to_tables.js')).runMigration012 },
  { id: '013', load: async () => (await import('./migrations/013_seed_contact_config.js')).runMigration013 },
  { id: '014', load: async () => (await import('./migrations/014_seed_student_config.js')).runMigration014 },
  { id: '015', load: async () => (await import('./migrations/015_seed_teacher_config.js')).runMigration015 },
  { id: '016', load: async () => (await import('./migrations/016_seed_session_config.js')).runMigration016 },
  { id: '017', load: async () => (await import('./migrations/017_seed_attendance_config.js')).runMigration017 },
  { id: '018', load: async () => (await import('./migrations/018_seed_overdue_obligations.js')).runMigration018 },
  { id: '019', load: async () => (await import('./migrations/019_seed_question_bank.js')).runMigration019 },
  { id: '020', load: async () => (await import('./migrations/020_migrate_contacts_to_tables.js')).runMigration020 },
  { id: '021', load: async () => (await import('./migrations/021_migrate_custom_tabs.js')).runMigration021 },
  { id: '022', load: async () => (await import('./migrations/022_migrate_students_to_tables.js')).runMigration022 },
  { id: '023', load: async () => (await import('./migrations/023_migrate_teachers_to_tables.js')).runMigration023 },
  { id: '024', load: async () => (await import('./migrations/024_migrate_sessions_to_tables.js')).runMigration024 },
  { id: '025', load: async () => (await import('./migrations/025_migrate_attendance_to_tables.js')).runMigration025 },
  { id: '026', load: async () => (await import('./migrations/026_migrate_enrollments_to_tables.js')).runMigration026 },
  { id: '027', load: async () => (await import('./migrations/027_migrate_obligations_to_tables.js')).runMigration027 },
  { id: '028', load: async () => (await import('./migrations/028_migrate_finance_to_tables.js')).runMigration028 },
  { id: '029', load: async () => (await import('./migrations/029_migrate_examinations_to_tables.js')).runMigration029 },
  { id: '030', load: async () => (await import('./migrations/030_migrate_hasanat_to_tables.js')).runMigration030 },
  { id: '031', load: async () => (await import('./migrations/031_migrate_accounting_to_tables.js')).runMigration031 },
  { id: '032', load: async () => (await import('./migrations/032_migrate_question_bank_to_tables.js')).runMigration032 },
  { id: '033', load: async () => (await import('./migrations/033_migrate_logs_to_tables.js')).runMigration033 },
  { id: '034', load: async () => (await import('./migrations/034_purge_overdue_obligations.js')).runMigration034 },
  { id: '035', load: async () => (await import('./migrations/035_migrate_messaging_to_tables.js')).runMigration035 },
  { id: '036', load: async () => (await import('./migrations/036_migrate_contacts_secrets_and_reports.js')).runMigration036 },
];

export async function initDb(): Promise<void> {
  try {
    initializeDatabaseConnection();
    const pool = getPool();

    const backendRoot = resolveBackendRoot();
    const srcMigrations = join(backendRoot, 'src/db/migrations_drizzle');
    const distMigrations = join(backendRoot, 'dist/db/migrations_drizzle');
    const migrationsFolder = existsSync(srcMigrations) ? srcMigrations : distMigrations;
    const migrateClient = await pool.connect();
    try {
      await migrateClient.query(`SELECT set_config('app.rls_bypass', 'on', false)`);
      const migrateDb = drizzle(migrateClient, { schema });
      try {
        await migrate(migrateDb, { migrationsFolder });
      } catch (err: unknown) {
        const pgErr = err as {
          code?: string;
          message?: string;
          cause?: { code?: string; message?: string };
        };
        const code = pgErr?.code || pgErr?.cause?.code;
        const msg = pgErr?.message || pgErr?.cause?.message || String(err);
        if (
          code === '42P07' ||
          code === '42710' ||
          code === '42P06' ||
          msg.includes('already exists')
        ) {
          console.warn(
            `[dbInit] Pre-existing schema relations or constraints detected (${code ?? 'already exists'}), continuing startup cleanly...`,
          );
        } else {
          throw err;
        }
      }
    } finally {
      migrateClient.release();
    }

    await runDataMigrations();
    await purgeExpiredAuthArtifacts();
    await ensurePlatformSuperUserFromEnv();
    await initPlatformSettings();

    const results = await getRootDb().select({ count: sql<number>`count(*)` }).from(schema.collections);
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

async function runDataMigrations(): Promise<void> {
  const migrationLockClient = await getPool().connect();
  try {
    await migrationLockClient.query('select pg_advisory_lock($1::integer)', [DATA_MIGRATION_LOCK_KEY]);
    await migrationLockClient.query('CREATE TABLE IF NOT EXISTS data_migrations (id text PRIMARY KEY, applied_at timestamp default now() NOT NULL);');

    const applied = await getRootDb().select().from(schema.dataMigrations);
    const appliedSet = new Set(applied.map((migration) => migration.id));
    for (const migration of dataMigrationsToRun) {
      if (!appliedSet.has(migration.id)) {
        console.log(`[Data Migration] Running pending data migration ${migration.id}...`);
        const run = await migration.load();
        await run();
        await getRootDb().insert(schema.dataMigrations).values({ id: migration.id }).onConflictDoNothing();
        appliedSet.add(migration.id);
      }
    }
  } finally {
    await migrationLockClient.query('select pg_advisory_unlock($1::integer)', [DATA_MIGRATION_LOCK_KEY]).catch(() => undefined);
    migrationLockClient.release();
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
