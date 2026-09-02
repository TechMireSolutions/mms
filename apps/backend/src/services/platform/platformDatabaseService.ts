import pg from 'pg';
import { loadServerConfig } from '../../config/serverConfig.js';
import {
  closeDatabase,
  initializeDatabaseConnection,
  initDb,
  resetDbInitStateForTesting,
} from '../../db/database.js';

/**
 * Wipes the entire PostgreSQL database schema and re-executes migrations,
 * seeds, and platform superuser bootstrapping. Restricted to platform super-users.
 *
 * Closes the app pool before terminating other backends so idle pool clients are
 * not killed underneath the running Node process (which previously caused 502s).
 */
export async function resetAndReseedDatabase(): Promise<void> {
  const { databaseUrl } = loadServerConfig();
  console.log('[Platform Database Reset] Super-user requested full database reset. Closing app pool...');

  await closeDatabase();

  try {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();

    await using _clientDisposer = {
      [Symbol.asyncDispose]: async () => {
        await client.end().catch(() => undefined);
      },
    };

    // Guard against hanging locks
    await client.query(`
      SET lock_timeout = '10s';
      SET statement_timeout = '30s';
    `);

    // Release leftover sessions (tools, stale clients). App pool is already closed.
    try {
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = current_database()
          AND pid <> pg_backend_pid()
          AND backend_type = 'client backend';
      `);
    } catch (err) {
      console.warn(
        '[Platform Database Reset] Warning: Could not terminate other active backend connections (insufficient privileges):',
        err,
      );
    }

    // Drop objects individually instead of dropping the public schema (privilege-safe).
    await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE';
          END LOOP;

          FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
          END LOOP;

          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;

          FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
              EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
          END LOOP;

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
    initializeDatabaseConnection();
  }

  resetDbInitStateForTesting();
  await initDb({ force: true });
  console.log('[Platform Database Reset] Database successfully reset and re-seeded!');
}
