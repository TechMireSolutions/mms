import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mms';

import { initDb, seedDatabase, closeDatabase } from '../src/db/database.js';
import { getDb } from '../src/db/dbClient.js';
import * as schema from '../src/db/schema.js';
import { hashPassword } from '../src/services/auth/passwordService.js';
import { randomBytes } from 'crypto';

async function main() {
  console.log('Connecting to database for hard reset...');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log('Dropping all tables dynamically in public schema...');
    await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    console.log('Dropping drizzle schema if exists...');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  } catch (err) {
    console.error('Error wiping database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('Initializing database schema and migrations...');
  await initDb();
  const db = getDb();

  console.log('Seeding minimal platform default collections...');
  await seedDatabase();

  console.log('Marking all data migrations (001-033) as completed...');
  for (let i = 1; i <= 33; i++) {
    const id = String(i).padStart(3, '0');
    await db.insert(schema.dataMigrations).values({ id }).onConflictDoNothing();
  }

  console.log('Creating platform super-admin user...');
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim() || 'syedaalin@gmail.com';
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim().replace(/^"|"$/g, '') || 'Pa$$w0rd';
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Syed Aalin';
  const passwordHash = await hashPassword(password);

  await db.insert(schema.platformUsers).values({
    id: randomBytes(8).toString('hex'),
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: 'super_user',
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Platform super-admin user created: ${email}`);
  console.log('Database 100% empty reset completed successfully!');
  await closeDatabase();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Error during reset:', err);
  await closeDatabase().catch(() => undefined);
  process.exit(1);
});
