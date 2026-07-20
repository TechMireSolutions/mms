import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { initDb, closeDatabase } from '../src/db/database.js';
import { loadContactsPage } from '../src/services/contactService.js';
import { runWithTenant } from '../src/lib/tenantContext.js';

async function main() {
  await initDb();
  
  await runWithTenant('dq', async () => {
    const page = await loadContactsPage({ page: 1, limit: 20 });
    console.log('Result for dq:', JSON.stringify(page));
  });

  await closeDatabase();
}

main().catch(console.error);
