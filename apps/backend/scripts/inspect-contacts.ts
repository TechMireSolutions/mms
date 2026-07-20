import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { initDb, closeDatabase } from '../src/db/database.js';
import { getDb } from '../src/db/dbClient.js';
import * as schema from '../src/db/schema.js';

async function main() {
  await initDb();
  const db = getDb();
  
  const allContacts = await db.select().from(schema.contacts);
  console.log('Total contacts in database:', allContacts.length);
  for (const c of allContacts) {
    console.log(`- Subdomain: ${c.workspaceSubdomain}, ID: ${c.id}`);
    console.log(`  Data:`, JSON.stringify(c.customData));
  }
  
  const allWorkspaces = await db.select().from(schema.collections);
  const workspaces = allWorkspaces.find(x => x.name === 'workspaces');
  console.log('Workspaces:', workspaces ? workspaces.data : 'none');

  await closeDatabase();
}

main().catch(console.error);
