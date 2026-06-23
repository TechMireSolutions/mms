import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import { like } from 'drizzle-orm';
import * as schema from '/Users/syedaalin/Documents/mms/apps/backend/src/db/schema.ts';

dotenv.config({ path: '/Users/syedaalin/Documents/mms/apps/backend/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mms';

async function main() {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  try {
    const results = await db.select().from(schema.collections).where(like(schema.collections.name, 't:dar-ul-quran:%'));
    for (const row of results) {
      const parsed = JSON.parse(row.data);
      console.log(`${row.name}: ${Array.isArray(parsed) ? parsed.length : typeof parsed} items`);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
