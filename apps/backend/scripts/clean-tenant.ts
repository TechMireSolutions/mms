import { initDb, saveCollection } from '../src/db/database.js';
import { runWithTenant } from '../src/lib/tenantContext.js';
import { getMinimalCollectionsForSeed } from '../src/db/minimalSeeds.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const subdomain = 'dar-ul-quran';

async function main() {
  await initDb();

  await runWithTenant(subdomain, async () => {
    console.log(`Cleaning tenant: ${subdomain}...`);
    
    // Get minimal collections
    const minimal = await getMinimalCollectionsForSeed();
    
    // We want to clear everything except 'users'
    for (const [name, data] of Object.entries(minimal)) {
      if (name === 'users') {
        console.log(`Skipping 'users' collection to preserve your account.`);
        continue;
      }
      console.log(`Clearing/replacing collection: ${name}`);
      await saveCollection(name, data);
    }
    
    console.log(`Tenant ${subdomain} successfully cleaned of demo data!`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
