/**
 * Deletes orphan document-store Students Setup keys after typed-table backfill (042).
 * Safe to re-run: skips delete when typed Setup rows are missing for that tenant.
 */
import { eq } from 'drizzle-orm';
import { parseTenantScopedStorageKey } from '@mms/shared';
import * as schema from '../schema.js';
import { deleteObjectByStorageKey, listObjectStorageKeys } from '../database.js';
import { withTenant } from '../tenant-context.js';
import {
  STUDENTS_COLUMN_PREFS_OBJECT_KEY,
  STUDENTS_SETTINGS_OBJECT_KEY,
} from '../hydrateStudentsSetupFromLegacyBackup.js';

type Tx = Parameters<Parameters<typeof withTenant>[1]>[0];

async function tenantHasTypedFieldOrPrefs(tx: Tx, tenant: string): Promise<boolean> {
  const [field] = await tx
    .select({ workspaceSubdomain: schema.studentFieldConfigs.workspaceSubdomain })
    .from(schema.studentFieldConfigs)
    .where(eq(schema.studentFieldConfigs.workspaceSubdomain, tenant))
    .limit(1);
  if (field) return true;
  const [prefs] = await tx
    .select({ workspaceSubdomain: schema.studentModulePreferences.workspaceSubdomain })
    .from(schema.studentModulePreferences)
    .where(eq(schema.studentModulePreferences.workspaceSubdomain, tenant))
    .limit(1);
  return Boolean(prefs);
}

async function tenantHasTypedColumnPrefs(tx: Tx, tenant: string): Promise<boolean> {
  const [row] = await tx
    .select({ userId: schema.studentUserColumnPrefs.userId })
    .from(schema.studentUserColumnPrefs)
    .where(eq(schema.studentUserColumnPrefs.workspaceSubdomain, tenant))
    .limit(1);
  return Boolean(row);
}

type LegacySetupCandidate = {
  key: string;
  tenant: string;
  kind: 'settings' | 'columnPrefs';
};

export async function runMigration043(): Promise<void> {
  const keys = await listObjectStorageKeys();
  const candidates: LegacySetupCandidate[] = [];

  for (const key of keys) {
    const parsed = parseTenantScopedStorageKey(key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    if (parsed.logicalKey === STUDENTS_SETTINGS_OBJECT_KEY) {
      candidates.push({ key, tenant, kind: 'settings' });
    } else if (parsed.logicalKey === STUDENTS_COLUMN_PREFS_OBJECT_KEY) {
      candidates.push({ key, tenant, kind: 'columnPrefs' });
    }
  }

  if (candidates.length === 0) {
    console.log('[Migration 043] No orphan Students Setup object keys to clear.');
    return;
  }

  const toDelete: string[] = [];
  let skipped = 0;

  await withTenant(null, async (tx) => {
    const setupCache = new Map<string, boolean>();
    const columnCache = new Map<string, boolean>();

    const hasSetup = async (tenant: string): Promise<boolean> => {
      const cached = setupCache.get(tenant);
      if (cached !== undefined) return cached;
      const value = await tenantHasTypedFieldOrPrefs(tx, tenant);
      setupCache.set(tenant, value);
      return value;
    };

    const hasColumn = async (tenant: string): Promise<boolean> => {
      const cached = columnCache.get(tenant);
      if (cached !== undefined) return cached;
      const value = await tenantHasTypedColumnPrefs(tx, tenant);
      columnCache.set(tenant, value);
      return value;
    };

    for (const candidate of candidates) {
      const allowed =
        candidate.kind === 'settings'
          ? await hasSetup(candidate.tenant)
          : (await hasColumn(candidate.tenant)) || (await hasSetup(candidate.tenant));
      if (!allowed) {
        skipped += 1;
        console.warn(
          `[Migration 043] Skipping "${candidate.key}": typed Students Setup missing for tenant "${candidate.tenant}".`,
        );
        continue;
      }
      toDelete.push(candidate.key);
    }
  });

  for (const key of toDelete) {
    await deleteObjectByStorageKey(key);
    console.log(`[Migration 043] Deleted orphan object key "${key}".`);
  }

  if (toDelete.length === 0 && skipped === 0) {
    console.log('[Migration 043] No orphan Students Setup object keys to clear.');
  } else {
    console.log(
      `[Migration 043] Removed ${toDelete.length} key(s); skipped ${skipped} unsafe key(s).`,
    );
  }
}
