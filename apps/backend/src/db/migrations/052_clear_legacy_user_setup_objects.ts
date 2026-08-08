/**
 * Deletes orphan document-store Users Setup keys after typed-table backfill (051).
 * Safe to re-run: skips delete when typed Setup rows are missing for that tenant.
 */
import { eq } from 'drizzle-orm';
import { parseTenantScopedStorageKey, USERS_MODULE_MANIFEST } from '@mms/shared';
import * as schema from '../schema.js';
import { deleteObjectByStorageKey, listObjectStorageKeys } from '../database.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

const SETTINGS_KEY = USERS_MODULE_MANIFEST.settingsObjectKey;
const COLUMN_PREFS_KEY = USERS_MODULE_MANIFEST.columnPreferencesObjectKey;

type Tx = Parameters<Parameters<typeof withTenantTransaction>[1]>[0];

async function tenantHasTypedFieldOrPrefs(tx: Tx, tenant: string): Promise<boolean> {
  const [field] = await tx
    .select({ workspaceSubdomain: schema.userFieldConfigs.workspaceSubdomain })
    .from(schema.userFieldConfigs)
    .where(eq(schema.userFieldConfigs.workspaceSubdomain, tenant))
    .limit(1);
  if (field) return true;
  const [prefs] = await tx
    .select({ workspaceSubdomain: schema.userModulePreferences.workspaceSubdomain })
    .from(schema.userModulePreferences)
    .where(eq(schema.userModulePreferences.workspaceSubdomain, tenant))
    .limit(1);
  return Boolean(prefs);
}

async function tenantHasTypedColumnPrefs(tx: Tx, tenant: string): Promise<boolean> {
  const [row] = await tx
    .select({ userId: schema.userUserColumnPrefs.userId })
    .from(schema.userUserColumnPrefs)
    .where(eq(schema.userUserColumnPrefs.workspaceSubdomain, tenant))
    .limit(1);
  return Boolean(row);
}

type LegacySetupCandidate = {
  key: string;
  tenant: string;
  kind: 'settings' | 'columnPrefs';
};

export async function runMigration052(): Promise<void> {
  const keys = await listObjectStorageKeys();
  const candidates: LegacySetupCandidate[] = [];

  for (const key of keys) {
    const parsed = parseTenantScopedStorageKey(key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    if (parsed.logicalKey === SETTINGS_KEY) {
      candidates.push({ key, tenant, kind: 'settings' });
    } else if (parsed.logicalKey === COLUMN_PREFS_KEY) {
      candidates.push({ key, tenant, kind: 'columnPrefs' });
    }
  }

  if (candidates.length === 0) {
    console.log('[Migration 052] No orphan Users Setup object keys to clear.');
    return;
  }

  const toDelete: string[] = [];
  let skipped = 0;

  await withTenantTransaction(null, async (tx) => {
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
          `[Migration 052] Skipping "${candidate.key}": typed Users Setup missing for tenant "${candidate.tenant}".`,
        );
        continue;
      }
      toDelete.push(candidate.key);
    }
  });

  for (const key of toDelete) {
    await deleteObjectByStorageKey(key);
    console.log(`[Migration 052] Deleted orphan object key "${key}".`);
  }

  if (toDelete.length === 0 && skipped === 0) {
    console.log('[Migration 052] No orphan Users Setup object keys to clear.');
  } else {
    console.log(
      `[Migration 052] Removed ${toDelete.length} key(s); skipped ${skipped} unsafe key(s).`,
    );
  }
}
