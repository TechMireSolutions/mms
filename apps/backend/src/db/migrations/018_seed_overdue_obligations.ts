import {
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  WORKSPACES_COLLECTION,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  listCollectionStorageNames,
  saveCollection,
} from '../database.js';

const OVERDUE_OBLIGATIONS_COLLECTION = 'overdue_obligations';

async function discoverTenantSubdomains(): Promise<Set<string>> {
  const subdomains = new Set<string>();
  const names = await listCollectionStorageNames();
  for (const name of names) {
    const parsed = parseTenantScopedStorageKey(name);
    if (parsed) subdomains.add(parsed.subdomain);
  }
  const workspaces = await getCollectionByStorageName(WORKSPACES_COLLECTION);
  if (Array.isArray(workspaces)) {
    for (const entry of workspaces) {
      const subdomain = (entry as Workspace).subdomain;
      if (subdomain) subdomains.add(subdomain);
    }
  }
  return subdomains;
}

async function seedOverdueObligationsForPrefix(prefix: string): Promise<boolean> {
  const storageName = prefix ? `${prefix}${OVERDUE_OBLIGATIONS_COLLECTION}` : OVERDUE_OBLIGATIONS_COLLECTION;
  const existing = await getCollectionByStorageName(storageName);
  if (Array.isArray(existing) && existing.length > 0) return false;
  await saveCollection(storageName, []);
  return true;
}

/**
 * Backfills database-owned Overdue Obligations data for existing SQLite/PostgreSQL tenants.
 */
export async function runMigration018(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  if (subdomains.size === 0) {
    changed = await seedOverdueObligationsForPrefix('');
  } else {
    for (const subdomain of subdomains) {
      const didChange = await seedOverdueObligationsForPrefix(tenantCollectionKey(subdomain, ''));
      changed = changed || didChange;
    }
  }

  if (changed) {
    console.log('[Migration 018] Seeded database-owned overdue obligations defaults.');
  }
}
