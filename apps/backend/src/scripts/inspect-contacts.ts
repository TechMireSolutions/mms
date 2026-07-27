import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { initDb } from '../db/database.js';
import { getDb } from '../db/dbClient.js';
import { contacts } from '../db/schema.js';

async function main() {
  await initDb();
  const db = getDb();
  const rows = await db.select().from(contacts);
  
  console.log('=== LOCAL DATABASE CONTACTS AUDIT REPORT ===');
  console.log(`Total Contact Records in Database: ${rows.length}\n`);
  
  const bySubdomain: Record<string, number> = {};
  rows.forEach(r => {
    bySubdomain[r.workspaceSubdomain] = (bySubdomain[r.workspaceSubdomain] || 0) + 1;
  });
  console.log('--- Workspace Distribution ---');
  Object.entries(bySubdomain).forEach(([sub, count]) => {
    console.log(`- Subdomain: "${sub}": ${count} contacts`);
  });
  
  console.log('\n--- Contact Details Inspection (Demo Workspace) ---');
  const demoContacts = rows.filter(r => r.workspaceSubdomain === 'demo');
  
  demoContacts.forEach((r, idx) => {
    const d = (r.customData || {}) as Record<string, any>;
    console.log(`[#${idx + 1}] ID: ${r.id}`);
    console.log(`  Name: ${d.name || 'N/A'} (First: "${d.firstName || ''}", Last: "${d.lastName || ''}")`);
    console.log(`  Gender: ${d.gender || 'N/A'} | DOB: ${d.dob || 'N/A'} | Syed Lineage: ${d.isSyed ? 'Yes' : 'No'}`);
    console.log(`  Phones: ${JSON.stringify(d.phones || [])}`);
    console.log(`  Emails: ${JSON.stringify(d.emails || [])}`);
    console.log(`  Addresses: ${JSON.stringify(d.addresses || [])}`);
    console.log(`  Location: City="${d.city || ''}", State="${d.state || ''}", Country="${d.country || ''}"`);
    console.log(`  Notes: ${d.notes || 'None'}`);
    console.log(`  Soft Deleted: ${r.deletedAt ? `Yes (${r.deletedAt})` : 'No'}`);
    console.log('----------------------------------------------------');
  });
  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
