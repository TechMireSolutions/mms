import { isServerOnlyObjectKey } from '@mms/shared';
import {
  getCollection as dbGetCollection,
  saveCollection as dbSaveCollection,
  getObject as dbGetObject,
  saveObject as dbSaveObject,
  getAllData as dbGetAllData,
  resetTenantData as dbResetTenantData,
  runInTransaction
} from '../db/database.js';

export interface SyncPayload {
  collections?: Record<string, unknown[]>;
  objects?: Record<string, unknown>;
}

/**
 * Retrieves a snapshot of all database collections and objects.
 *
 * @returns {Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }>} The full database sync snapshot.
 */
export async function fetchDatabaseSnapshot(): Promise<{ collections: Record<string, unknown[]>; objects: Record<string, unknown> }> {
  return await dbGetAllData();
}

/**
 * Performs a synchronized batch write of collections and objects.
 * Uses a single database transaction block to guarantee atomicity and speed up bulk inserts.
 *
 * @param {SyncPayload} payload - The sync collections and objects.
 * @returns {Promise<void>}
 */
export async function synchronizeData(payload: SyncPayload): Promise<void> {
  const { collections, objects } = payload;
  
  await runInTransaction(async () => {
    if (collections) {
      for (const [name, collectionItems] of Object.entries(collections)) {
        if (Array.isArray(collectionItems)) {
          await dbSaveCollection(name, collectionItems);
        }
      }
    }

    if (objects) {
      for (const [key, objectValue] of Object.entries(objects)) {
        if (isServerOnlyObjectKey(key)) continue;
        await dbSaveObject(key, objectValue);
      }
    }
  });
}

/**
 * Resets the current tenant to minimal defaults (scoped; does not drop global tables).
 */
export async function resetToDefaults(): Promise<void> {
  await dbResetTenantData();
}

/**
 * Retrieves a specific collection by name.
 *
 * @param {string} name - The collection name.
 * @returns {Promise<unknown[] | null>} The collection contents or null.
 */
export async function fetchCollection(name: string): Promise<unknown[] | null> {
  return await dbGetCollection(name);
}

/**
 * Persists a collection by name.
 *
 * @param {string} name - The collection name.
 * @param {unknown[]} data - The collection documents.
 * @returns {Promise<void>}
 */
export async function persistCollection(name: string, collectionItems: unknown[]): Promise<void> {
  await dbSaveCollection(name, collectionItems);
}

/**
 * Retrieves a specific key-value object by key.
 *
 * @param {string} key - The object identifier.
 * @returns {Promise<unknown | null>} The object value or null.
 */
export async function fetchObject(key: string): Promise<unknown | null> {
  return await dbGetObject(key);
}

/**
 * Persists a key-value object by key.
 *
 * @param {string} key - The object identifier.
 * @param {unknown} data - The object value data.
 * @returns {Promise<void>}
 */
export async function persistObject(key: string, objectValue: unknown): Promise<void> {
  await dbSaveObject(key, objectValue);
}

/** Removes a tenant-scoped object by logical key. */
export async function deletePersistedObject(key: string): Promise<void> {
  const { deleteObject } = await import('../db/database.js');
  await deleteObject(key);
}
