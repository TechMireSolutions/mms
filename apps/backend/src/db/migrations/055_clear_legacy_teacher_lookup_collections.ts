/**
 * Deletes orphan document-store Teachers lookup collections after typed backfill (054).
 * Safe to re-run: skips delete when typed `teacher_lookups` has no rows for that tenant+kind.
 */
import { and, eq } from 'drizzle-orm';
import {
  TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS,
  isTeacherLookupLegacyCollectionKey,
  parseTenantScopedStorageKey,
  type TeacherLookupKind,
} from '@mms/shared';
import * as schema from '../schema.js';
import {
  deleteCollectionByStorageName,
  listCollectionStorageNames,
} from '../database.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

async function tenantHasTypedLookupKind(
  tenant: string,
  kind: TeacherLookupKind,
): Promise<boolean> {
  return withTenantTransaction(null, async (tx) => {
    const [row] = await tx
      .select({ id: schema.teacherLookups.id })
      .from(schema.teacherLookups)
      .where(
        and(
          eq(schema.teacherLookups.workspaceSubdomain, tenant),
          eq(schema.teacherLookups.kind, kind),
        ),
      )
      .limit(1);
    return Boolean(row);
  });
}

export async function runMigration055(): Promise<void> {
  const names = await listCollectionStorageNames();
  let removed = 0;
  let skipped = 0;

  for (const name of names) {
    const parsed = parseTenantScopedStorageKey(name);
    if (!parsed) continue;
    const legacyKey = parsed.logicalKey;
    if (!isTeacherLookupLegacyCollectionKey(legacyKey)) continue;
    const kind = TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS[legacyKey];
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;

    const hasTyped = await tenantHasTypedLookupKind(tenant, kind);
    if (!hasTyped) {
      skipped += 1;
      console.warn(
        `[Migration 055] Skipping "${name}": typed teacher_lookups kind "${kind}" empty for "${tenant}".`,
      );
      continue;
    }

    await deleteCollectionByStorageName(name);
    removed += 1;
    console.log(`[Migration 055] Deleted legacy lookup collection "${name}".`);
  }

  if (removed === 0 && skipped === 0) {
    console.log('[Migration 055] No legacy teacher lookup collections to clear.');
  } else {
    console.log(`[Migration 055] Removed ${removed} key(s); skipped ${skipped} unsafe key(s).`);
  }
}
