import {
  isServerOnlyObjectKey,
  BACKUP_EPHEMERAL_OBJECT_KEYS,
  type TenantDatabaseSnapshot,
} from '@mms/shared';
import {
  getCollection as dbGetCollection,
  saveCollection as dbSaveCollection,
  deleteCollection as dbDeleteCollection,
  getObject as dbGetObject,
  saveObject as dbSaveObject,
  getAllData as dbGetAllData,
  resetTenantData as dbResetTenantData,
  deleteObject as dbDeleteObject,
  listTenantObjectLogicalKeys as dbListTenantObjectLogicalKeys,
  listTenantCollectionLogicalKeys as dbListTenantCollectionLogicalKeys,
  runInReadSnapshotTransaction,
  runInTransaction
} from '../db/database.js';
import { loadRelationalSnapshotCollections } from '../db/relationalSnapshot.js';
import {
  sortCollectionNamesForRestore,
  withCompleteRelationalRestoreCollections,
} from '../db/relationalReplaceMapping.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { throwIfSyncAborted } from '../lib/syncLimits.js';
import { clearTenantBackgroundJobs } from './backgroundJobService.js';

/**
 * Retrieves a snapshot of all database collections and objects.
 *
 * @returns {Promise<TenantDatabaseSnapshot>} The full database sync snapshot.
 */
export async function fetchDatabaseSnapshot(): Promise<TenantDatabaseSnapshot> {
  return await dbGetAllData();
}

/**
 * Retrieves a full-fidelity workspace snapshot for backup export.
 *
 * Combines:
 * - Tenant document-store collections/objects (lookups, settings, per-user inboxes)
 * - Authoritative relational tables for every REST-migrated module
 *
 * Intentionally omitted: audit trail, password hashes, server-only secrets,
 * background jobs, and uploaded binary files.
 *
 * Reads run in one REPEATABLE READ transaction so concurrent writes cannot tear the
 * snapshot across the document store and the relational tables.
 *
 * @returns {Promise<TenantDatabaseSnapshot>} The backup snapshot.
 */
export async function fetchBackupSnapshot(): Promise<TenantDatabaseSnapshot> {
  return await runInReadSnapshotTransaction(async () => {
    const snapshot = await dbGetAllData();
    const tenant = getRequestTenant();
    if (!tenant) return snapshot;

    const relational = await loadRelationalSnapshotCollections(tenant);
    return {
      ...snapshot,
      collections: { ...(snapshot.collections ?? {}), ...relational },
    };
  });
}

/**
 * Performs a synchronized batch write of collections and objects.
 * Uses a single database transaction block to guarantee atomicity and speed up bulk inserts.
 *
 * @param {TenantDatabaseSnapshot} payload - The sync collections and objects.
 * @param {AbortSignal} [signal] - Aborts mid-restore so the transaction rolls back.
 * @returns {Promise<void>}
 */
export async function synchronizeData(
  payload: TenantDatabaseSnapshot,
  signal?: AbortSignal,
): Promise<void> {
  const collections = withCompleteRelationalRestoreCollections(payload.collections);
  const { objects } = payload;
  // Only a full workspace backup carries users; partial syncs must not prune.
  const isFullRestore = Array.isArray(payload.collections?.users);

  await runInTransaction(async () => {
    if (isFullRestore) {
      // Jobs race mid-restore and export artifacts are not in the envelope.
      await clearTenantBackgroundJobs();
    }

    const restoredCollectionKeys = new Set<string>();
    for (const name of sortCollectionNamesForRestore(Object.keys(collections))) {
      throwIfSyncAborted(signal);
      const collectionItems = collections[name];
      if (Array.isArray(collectionItems)) {
        // Admin bulk restore: intentionally replace mirrored relational tables.
        await dbSaveCollection(name, collectionItems, { mirrorRelationalReplace: true });
        restoredCollectionKeys.add(name);
      }
    }

    if (isFullRestore) {
      for (const key of await dbListTenantCollectionLogicalKeys()) {
        throwIfSyncAborted(signal);
        if (!restoredCollectionKeys.has(key)) await dbDeleteCollection(key);
      }
    }

    if (objects) {
      const restoredKeys = new Set<string>();
      for (const [key, objectValue] of Object.entries(objects)) {
        throwIfSyncAborted(signal);
        if (isServerOnlyObjectKey(key)) continue;
        await dbSaveObject(key, objectValue);
        restoredKeys.add(key);
      }

      if (isFullRestore) {
        // Settings created after the backup must not survive a full restore.
        for (const key of await dbListTenantObjectLogicalKeys()) {
          throwIfSyncAborted(signal);
          if (!restoredKeys.has(key)) await dbDeleteObject(key);
        }
        // Ephemeral caches/artifacts are never exported — drop them on full restore.
        // Credential stores (email secrets, Google sync tokens) stay on the server.
        for (const key of BACKUP_EPHEMERAL_OBJECT_KEYS) {
          await dbDeleteObject(key);
        }
      }
    } else if (isFullRestore) {
      for (const key of BACKUP_EPHEMERAL_OBJECT_KEYS) {
        await dbDeleteObject(key);
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
  // JSON document store only — never wipe REST-migrated relational tables.
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
