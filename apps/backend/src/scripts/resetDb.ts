import { execSync } from 'node:child_process';
import pg from 'pg';
import { loadBackendEnv, resolveBackendRoot } from '../config/loadEnv.js';
import { initDb, closeDatabase } from '../db/database.js';

loadBackendEnv();

async function resetAndRecreateDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mms';
  console.log('[1/3] Connecting to PostgreSQL to drop public schema...');
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('[1/3] Local database schema dropped and recreated successfully.');
  } finally {
    client.release();
    await pool.end();
  }

  console.log('[2/3] Applying Drizzle schema tables...');
  execSync('npx drizzle-kit push --force', { stdio: 'inherit', cwd: resolveBackendRoot() });

  console.log('[3/3] Initializing database, running data migrations, and seeding default records...');
  await initDb();
  console.log('🎉 Local database successfully recreated and seeded!');
  await closeDatabase();
}

resetAndRecreateDb().catch((err) => {
  console.error('Failed to reset and recreate local database:', err);
  process.exit(1);
});
