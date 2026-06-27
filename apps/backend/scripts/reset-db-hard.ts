import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mms';

async function main() {
  console.log('Connecting to database...');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log('Dropping all tables and the drizzle schema...');
    await client.query('DROP TABLE IF EXISTS public.tenant_users CASCADE');
    await client.query('DROP TABLE IF EXISTS public.platform_users CASCADE');
    await client.query('DROP TABLE IF EXISTS public.auth_artifacts CASCADE');
    await client.query('DROP TABLE IF EXISTS public.collections CASCADE');
    await client.query('DROP TABLE IF EXISTS public.objects CASCADE');
    await client.query('DROP TABLE IF EXISTS public.data_migrations CASCADE');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    console.log('Database hard reset complete. Next backend startup will rebuild and seed.');
  } catch (err) {
    console.error('Error during hard reset:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
  process.exit(0);
}

main();
