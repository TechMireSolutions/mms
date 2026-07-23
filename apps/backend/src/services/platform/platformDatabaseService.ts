import { getPool, initDb } from '../../db/database.js';

/**
 * Wipes the entire PostgreSQL database schema and re-executes migrations,
 * seeds, and platform superuser bootstrapping. Restricted to platform super-users.
 */
export async function resetAndReseedDatabase(): Promise<void> {
  const pool = getPool();
  console.log('[Platform Database Reset] Super-user requested full database reset. Dropping schema...');

  const client = await pool.connect();
  try {
    // Forcefully terminate other database connections to release exclusive schema locks (e.g. background workers, other requests)
    try {
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = current_database()
          AND pid <> pg_backend_pid();
      `);
    } catch (err) {
      console.warn('[Platform Database Reset] Warning: Could not terminate other active backend connections (insufficient privileges):', err);
    }

    // Drop all tables individually instead of dropping the public schema to avoid privilege errors
    await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          -- 1. Drop all views
          FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
          END LOOP;

          -- 2. Drop all tables
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;

          -- 3. Drop all custom types/enums
          FOR r IN (
              SELECT typname 
              FROM pg_type t 
              JOIN pg_namespace n ON n.oid = t.typnamespace 
              WHERE n.nspname = 'public' 
                AND t.typtype = 'e'
          ) LOOP
              EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
    console.log('[Platform Database Reset] Tables cleared. Re-running database initialization and migrations...');
  } finally {
    client.release();
  }

  await initDb();
  console.log('[Platform Database Reset] Database successfully reset and re-seeded!');
}
