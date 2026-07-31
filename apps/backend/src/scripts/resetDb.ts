import pg from 'pg';
import { loadBackendEnv } from '../config/loadEnv.js';
import { initDb, closeDatabase } from '../db/database.js';

loadBackendEnv();

async function resetAndRecreateDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mms';
  console.log('[1/2] Connecting to PostgreSQL to drop public schema...');
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;');
    console.log('[1/2] Schema dropped and recreated.');
  } finally {
    client.release();
    await pool.end();
  }

  console.log('[2/2] Applying SQL migrations, data migrations, and seeding...');
  await initDb();
  console.log('🎉 Local database successfully recreated and seeded!');
  await closeDatabase();
}

resetAndRecreateDb().catch((err) => {
  console.error('Failed to reset and recreate local database:', err);
  process.exit(1);
});
