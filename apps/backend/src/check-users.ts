import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { initDb } from './db/database.js';
import { getDb } from './db/dbClient.js';
import { platformUsers } from './db/schema.js';

async function main() {
  await initDb();
  const db = getDb();
  const users = await db.select().from(platformUsers);
  console.log('PLATFORM USERS:', users);
  process.exit(0);
}

main().catch(console.error);
