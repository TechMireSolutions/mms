/**
 * Deletes orphan document-store Students lookup collections after typed backfill (044).
 * Safe to re-run: skips delete when typed `student_lookups` has no rows for that tenant+kind.
 */
import { and, eq } from 'drizzle-orm';
import {
  STUDENT_LOOKUP_LEGACY_COLLECTION_KEYS,
  isStudentLookupLegacyCollectionKey,
  parseTenantScopedStorageKey,
  type StudentLookupKind,
} from '@mms/shared';
import * as schema from '../schema.js';
import {
  deleteCollectionByStorageName,
  listCollectionStorageNames,
} from '../database.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

async function tenantHasTypedLookupKind(
  tenant: string,
  kind: StudentLookupKind,
): Promise<boolean> {
  return withTenantTransaction(null, async (tx) => {
    const [row] = await tx
      .select({ id: schema.studentLookups.id })
      .from(schema.studentLookups)
      .where(
        and(
          eq(schema.studentLookups.workspaceSubdomain, tenant),
          eq(schema.studentLookups.kind, kind),
        ),
      )
      .limit(1);
    return Boolean(row);
  });
}

export async function runMigration045(): Promise<void> {
  const names = await listCollectionStorageNames();
  let removed = 0;
  let skipped = 0;

  for (const name of names) {
    const parsed = parseTenantScopedStorageKey(name);
    if (!parsed) continue;
    const legacyKey = parsed.logicalKey;
    if (!isStudentLookupLegacyCollectionKey(legacyKey)) continue;
    const kind = STUDENT_LOOKUP_LEGACY_COLLECTION_KEYS[legacyKey];
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;

    const hasTyped = await tenantHasTypedLookupKind(tenant, kind);
    if (!hasTyped) {
      skipped += 1;
      console.warn(
        `[Migration 045] Skipping "${name}": typed student_lookups kind "${kind}" empty for "${tenant}".`,
      );
      continue;
    }

    await deleteCollectionByStorageName(name);
    removed += 1;
    console.log(`[Migration 045] Deleted legacy lookup collection "${name}".`);
  }

  if (removed === 0 && skipped === 0) {
    console.log('[Migration 045] No legacy student lookup collections to clear.');
  } else {
    console.log(`[Migration 045] Removed ${removed} key(s); skipped ${skipped} unsafe key(s).`);
  }
}
