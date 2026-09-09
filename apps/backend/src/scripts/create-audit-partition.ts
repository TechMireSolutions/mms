import { sql } from 'drizzle-orm';
import { loadBackendEnv } from '../config/loadEnv.js';
import { initDb } from '../db/dbInit.js';
import { activeDb, closeDatabase } from '../db/dbConnection.js';

loadBackendEnv();

/**
 * Section 5: Storage & Lifecycle Partition Provisioner.
 * Automatically provisions monthly date partitions for audit_trail_events hot storage.
 * Usage:
 *   pnpm --filter mms-backend tsx src/scripts/create-audit-partition.ts [YYYY-MM]
 * Example:
 *   pnpm --filter mms-backend tsx src/scripts/create-audit-partition.ts 2026-11
 */
async function main(): Promise<void> {
  let targetArg = process.argv[2];
  if (!targetArg) {
    // Default to next month
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const y = nextMonth.getUTCFullYear();
    const m = String(nextMonth.getUTCMonth() + 1).padStart(2, '0');
    targetArg = `${y}-${m}`;
  }

  const match = /^(\d{4})-(\d{2})$/.exec(targetArg);
  if (!match) {
    console.error('Usage: tsx src/scripts/create-audit-partition.ts <YYYY-MM>');
    console.error('Example: tsx src/scripts/create-audit-partition.ts 2026-11');
    process.exit(1);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  if (month < 1 || month > 12) {
    console.error('Invalid month. Must be between 01 and 12.');
    process.exit(1);
  }

  const partitionName = `audit_trail_events_y${year}m${String(month).padStart(2, '0')}`;
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const startIso = startDate.toISOString().replace('T', ' ').replace('.000Z', '+00');
  const endIso = endDate.toISOString().replace('T', ' ').replace('.000Z', '+00');

  console.log(`[create-audit-partition] Initializing database connection...`);
  await initDb();
  const db = activeDb();

  console.log(`[create-audit-partition] Creating monthly partition "${partitionName}" for [${startIso} to ${endIso})...`);
  const createSql = `
    CREATE TABLE IF NOT EXISTS "${partitionName}" PARTITION OF "audit_trail_events"
      FOR VALUES FROM ('${startIso}') TO ('${endIso}');
  `;
  await db.execute(sql.raw(createSql));
  console.log(`✅ Successfully created partition table "${partitionName}".`);

  await closeDatabase();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Fatal error during partition creation:', err);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
