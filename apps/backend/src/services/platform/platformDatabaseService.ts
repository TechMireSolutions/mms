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
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
        AND pid <> pg_backend_pid();
    `);

    // Drop all tables individually instead of dropping the public schema to avoid privilege errors
    await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
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
