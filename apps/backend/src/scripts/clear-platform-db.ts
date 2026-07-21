import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import pg from 'pg';
import { initDb } from '../db/database.js';

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Dropping public and drizzle schemas from PostgreSQL...');
  await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
  await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
  await client.query('CREATE SCHEMA public;');
  await client.query('GRANT ALL ON SCHEMA public TO public;');
  await client.end();

  console.log('Running clean database initialization & migrations...');
  await initDb();

  console.log('✅ Database completely wiped and reset to 100% initial state!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
