import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { like } from 'drizzle-orm';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../src/db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^sqlite:\/\//, '')
  : join(__dirname, '../mms.db');

async function main() {
  console.log(`Connecting to SQLite database at: ${dbPath}`);
  const sqliteDb = new Database(dbPath);
  const db = drizzle(sqliteDb, { schema });
  try {
    const results = await db.select().from(schema.collections).where(like(schema.collections.name, 't:dar-ul-quran:%'));
    for (const row of results) {
      const parsed = JSON.parse(row.data);
      console.log(`${row.name}: ${Array.isArray(parsed) ? parsed.length : typeof parsed} items`);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    sqliteDb.close();
  }
}

main();
