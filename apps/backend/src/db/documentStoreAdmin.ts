import {
  WORKSPACES_COLLECTION,
  isServerOnlyObjectKey,
  parseTenantScopedStorageKey,
} from '@mms/shared';
import { eq } from 'drizzle-orm';
import { getRequestTenant } from '../lib/tenantContext.js';
import { activeDb } from './dbConnection.js';
import * as schema from './schema.js';
import { hydrateObjectData } from './documentStoreCustomTabs.js';

export async function getAllData(): Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }> {
  try {
    const tenant = getRequestTenant();
    const collections: Record<string, unknown[]> = {};
    const colRows = await activeDb().select().from(schema.collections);
    for (const row of colRows) {
      if (row.name === WORKSPACES_COLLECTION) continue;
      const parsed = parseTenantScopedStorageKey(row.name);
      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        collections[parsed.logicalKey] = row.data;
      } else if (!parsed) {
        collections[row.name] = row.data;
      }
    }

    const objects: Record<string, unknown> = {};
    const objRows = await activeDb().select().from(schema.objects);
    for (const row of objRows) {
      const parsed = parseTenantScopedStorageKey(row.key);
      const logicalKey = parsed?.logicalKey ?? row.key;
      if (isServerOnlyObjectKey(logicalKey)) continue;

      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        objects[parsed.logicalKey] = await hydrateObjectData(parsed.logicalKey, row.data, tenant);
      } else if (!parsed) {
        objects[row.key] = row.data;
      }
    }

    return { collections, objects };
  } catch (error) {
    console.error('Error retrieving all database data:', error);
    throw error;
  }
}

/** Lists all collection storage names (including tenant-prefixed). */
export async function listCollectionStorageNames(): Promise<string[]> {
  const colRows = await activeDb().select({ name: schema.collections.name }).from(schema.collections);
  return colRows.map((row) => row.name);
}

/** Reads a collection by exact storage name (no tenant prefixing). */
export async function getCollectionByStorageName(name: string): Promise<unknown[] | null> {
  const rows = await activeDb().select().from(schema.collections).where(eq(schema.collections.name, name));
  const row = rows[0];
  if (!row) return null;
  return row.data;
}

/** Deletes a collection row by exact storage name. */
export async function deleteCollectionByStorageName(name: string): Promise<void> {
  await activeDb().delete(schema.collections).where(eq(schema.collections.name, name));
}

/** Deletes an object row by exact storage key. */
export async function deleteObjectByStorageKey(key: string): Promise<void> {
  await activeDb().delete(schema.objects).where(eq(schema.objects.key, key));
}

/** Lists all object storage keys (including tenant-prefixed). */
export async function listObjectStorageKeys(): Promise<string[]> {
  const objRows = await activeDb().select({ key: schema.objects.key }).from(schema.objects);
  return objRows.map((row) => row.key);
}

/**
 * Lists the request tenant's object logical keys, mirroring the filters `getAllData`
 * applies to backup exports so restore can prune whatever the backup does not carry.
 */
export async function listTenantObjectLogicalKeys(): Promise<string[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const objRows = await activeDb().select({ key: schema.objects.key }).from(schema.objects);
  const logicalKeys: string[] = [];
  for (const row of objRows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    if (!parsed || parsed.subdomain !== tenant) continue;
    if (isServerOnlyObjectKey(parsed.logicalKey)) continue;
    logicalKeys.push(parsed.logicalKey);
  }
  return logicalKeys;
}

/**
 * Lists the request tenant's collection logical keys (same scoping as `getAllData`).
 * Includes leftover document-store keys such as `whatsappTemplates_u:*`.
 */
export async function listTenantCollectionLogicalKeys(): Promise<string[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const colRows = await activeDb().select({ name: schema.collections.name }).from(schema.collections);
  const logicalKeys: string[] = [];
  for (const row of colRows) {
    if (row.name === WORKSPACES_COLLECTION) continue;
    const parsed = parseTenantScopedStorageKey(row.name);
    if (!parsed || parsed.subdomain !== tenant) continue;
    logicalKeys.push(parsed.logicalKey);
  }
  return logicalKeys;
}

/** Reads an object by exact storage key (no tenant prefixing). */
export async function getObjectByStorageKey(key: string): Promise<unknown | null> {
  const rows = await activeDb().select().from(schema.objects).where(eq(schema.objects.key, key));
  const row = rows[0];
  if (!row) return null;
  return row.data;
}
