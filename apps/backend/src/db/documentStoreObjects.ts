import { applyTitleCaseRecursive } from '@mms/shared';
import { eq } from 'drizzle-orm';
import { getRequestTenant } from '../lib/tenantContext.js';
import { activeDb } from './dbConnection.js';
import * as schema from './schema.js';
import { resolveObjectStorageKey } from './documentStoreKeys.js';
import { deleteObjectByStorageKey } from './documentStoreAdmin.js';

export async function getObject(key: string): Promise<unknown | null> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const rows = await activeDb().select().from(schema.objects).where(eq(schema.objects.key, storageKey));
    const row = rows[0];
    if (!row) return null;
    return row.data;
  } catch (error) {
    console.error(`Error getting object "${key}":`, error);
    throw error;
  }
}

export async function saveObject(key: string, data: unknown): Promise<void> {
  try {
    const storageKey = resolveObjectStorageKey(key);
    const tenant = getRequestTenant();
    const processedData = applyTitleCaseRecursive(data);
    await activeDb().insert(schema.objects)
      .values({ key: storageKey, data: processedData })
      .onConflictDoUpdate({
        target: schema.objects.key,
        set: { data: processedData },
      });

    if (tenant) {
      const { broadcastTenantUpdate } = await import('../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'object', key);
    }
  } catch (error) {
    console.error(`Error saving object "${key}":`, error);
    throw error;
  }
}

/** Deletes a tenant-scoped object by logical key. */
export async function deleteObject(key: string): Promise<void> {
  const storageKey = resolveObjectStorageKey(key);
  await deleteObjectByStorageKey(storageKey);
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('../services/websocketService.js');
    broadcastTenantUpdate(tenant, 'object', key);
  }
}
