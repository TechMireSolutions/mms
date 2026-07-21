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
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('[Platform Database Reset] Schema cleared. Re-running database initialization and migrations...');
  } finally {
    client.release();
  }

  await initDb();
  console.log('[Platform Database Reset] Database successfully reset and re-seeded!');
}
