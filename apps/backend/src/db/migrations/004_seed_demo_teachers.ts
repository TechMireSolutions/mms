import {
  DEMO_TEACHERS,
  DEFAULT_TEACHERS_SETTINGS,
  WORKSPACES_COLLECTION,
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  tenantObjectKey,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  getObjectByStorageKey,
  listCollectionStorageNames,
  listObjectStorageKeys,
  saveCollection,
  saveObject,
} from '../database.js';

const TEACHERS_COLLECTION = 'teachers';
const TEACHERS_SETTINGS_KEY = 'teachers_settings';

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

/**
 * Seeds demo teachers for tenants that have an empty or missing `teachers` collection.
 * Idempotent — skips tenants that already have teacher records.
 */
export async function runMigration004(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  if (subdomains.size === 0) {
    const legacyTeachers = await getCollectionByStorageName(TEACHERS_COLLECTION);
    if (!Array.isArray(legacyTeachers) || legacyTeachers.length === 0) {
      await saveCollection(TEACHERS_COLLECTION, [...DEMO_TEACHERS]);
      console.log('[Migration 004] Seeded demo teachers (legacy storage)');
      changed = true;
    }

    const objectKeys = await listObjectStorageKeys();
    if (!objectKeys.includes(TEACHERS_SETTINGS_KEY)) {
      await saveObject(TEACHERS_SETTINGS_KEY, DEFAULT_TEACHERS_SETTINGS);
      changed = true;
    }

    if (changed) {
      console.log('[Migration 004] Demo teachers migration completed.');
    }
    return;
  }

  for (const subdomain of subdomains) {
    const teachersKey = tenantCollectionKey(subdomain, TEACHERS_COLLECTION);
    const existing = await getCollectionByStorageName(teachersKey);
    if (!Array.isArray(existing) || existing.length === 0) {
      await saveCollection(teachersKey, [...DEMO_TEACHERS]);
      console.log(`[Migration 004] Seeded demo teachers for tenant "${subdomain}"`);
      changed = true;
    }

    const settingsKey = tenantObjectKey(subdomain, TEACHERS_SETTINGS_KEY);
    const settings = await getObjectByStorageKey(settingsKey);
    if (settings === null) {
      await saveObject(settingsKey, DEFAULT_TEACHERS_SETTINGS);
      changed = true;
    }
  }

  if (changed) {
    console.log('[Migration 004] Demo teachers migration completed.');
  }
}
