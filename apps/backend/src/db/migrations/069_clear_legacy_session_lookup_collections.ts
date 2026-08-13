import { SESSION_LOOKUP_LEGACY_COLLECTION_KEYS } from '@mms/shared';
import { inArray } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function runMigration069(): Promise<void> {
  const db = getDb();
  const legacySuffixes = Object.keys(SESSION_LOOKUP_LEGACY_COLLECTION_KEYS);
  if (legacySuffixes.length === 0) return;

  // Actually, let's just fetch all and filter in JS to be safe with `workspace:key` format.

  const allRows = await db.select({ name: schema.collections.name }).from(schema.collections);

  const toDelete = allRows
    .map((r) => r.name)
    .filter((name) => {
      const parts = name.split(':');
      if (parts.length < 2) return false;
      const key = parts.slice(1).join(':');
      return legacySuffixes.includes(key);
    });

  if (toDelete.length === 0) {
    console.log('[Migration 069] No legacy session lookup collections found to delete.');
    return;
  }

  await withTenantTransaction(null, async (tx) => {
    // Delete in chunks to avoid max params limit
    const chunkSize = 100;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      await tx.delete(schema.collections).where(inArray(schema.collections.name, chunk));
    }
  });

  console.log(`[Migration 069] Deleted ${toDelete.length} legacy session lookup collections.`);
}
