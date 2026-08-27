import {
  isBackupExcludedObjectKey,
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
import {
  hydrateStudentsSetupCollectionsFromLegacyObjects,
  STUDENTS_LEGACY_SETUP_OBJECT_KEYS,
} from '../db/hydrateStudentsSetupFromLegacyBackup.js';
import {
  hydrateTeachersSetupCollectionsFromLegacyObjects,
  TEACHERS_LEGACY_SETUP_OBJECT_KEYS,
} from '../db/hydrateTeachersSetupFromLegacyBackup.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { throwIfSyncAborted } from '../lib/syncLimits.js';
import { acquireTenantRestoreLock, RestoreInProgressError } from '../lib/restoreLock.js';
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
    const { getWorkspaceBranding, getWorkspaceGlobalSettings } = await import(
      '../db/repositories/workspaceRepository.js'
    );
    const { loadEmailIntegrationConfig } = await import('./email/emailIntegrationService.js');
    
    const branding = await getWorkspaceBranding(tenant);
    const globalSettings = await getWorkspaceGlobalSettings(tenant);
    const emailIntegration = await loadEmailIntegrationConfig();

    const snapshotPayload: TenantDatabaseSnapshot = {
      ...snapshot,
      collections: { ...(snapshot.collections ?? {}), ...relational },
      objects: {
        ...(snapshot.objects ?? {}),
        ...(branding ? { branding } : {}),
        ...(globalSettings ? { global_settings: globalSettings } : {}),
        ...(emailIntegration ? { email_integration: emailIntegration } : {}),
      },
    };

    const { exportBackupAssetsForSnapshot } = await import('./backupAssetService.js');
    const assets = await exportBackupAssetsForSnapshot(snapshotPayload);

    return {
      ...snapshotPayload,
      ...(Object.keys(assets).length > 0 ? { assets } : {}),
    };
  });
}

/**
 * Performs a synchronized batch write of collections and objects.
 * Uses a single database transaction block to guarantee atomicity and speed up bulk inserts.
 *
 * @param {TenantDatabaseSnapshot} payload - The sync collections and objects.
 * @param {AbortSignal} [signal] - Aborts mid-restore so the transaction rolls back.
 * @param {boolean} [fullRestore] - When true, prunes collections/objects not present in the
 *   payload and clears ephemeral keys. Must be set explicitly by the caller; do not infer from
 *   payload shape to avoid accidentally wiping the workspace on partial syncs.
 * @returns {Promise<void>}
 */
export async function synchronizeData(
  payload: TenantDatabaseSnapshot,
  signal?: AbortSignal,
  fullRestore = false,
): Promise<void> {
  const collections = withCompleteRelationalRestoreCollections(
    fullRestore
      ? hydrateTeachersSetupCollectionsFromLegacyObjects(
          hydrateStudentsSetupCollectionsFromLegacyObjects(
            { ...(payload.collections ?? {}) },
            payload.objects,
          ),
          payload.objects,
        )
      : payload.collections,
  );
  const { objects } = payload;
  const skipLegacySetupObjects = new Set<string>(
    fullRestore
      ? [...STUDENTS_LEGACY_SETUP_OBJECT_KEYS, ...TEACHERS_LEGACY_SETUP_OBJECT_KEYS]
      : [],
  );

  const restoredCollectionKeys = new Set<string>();

  await runInTransaction(async () => {
    // Block concurrent restores for the same tenant. The lock is transaction-scoped,
    // so it releases on commit/rollback — a timed-out or failed restore never wedges it.
    const tenant = getRequestTenant();
    if (tenant && !(await acquireTenantRestoreLock(tenant))) {
      throw new RestoreInProgressError();
    }

    if (fullRestore) {
      // Jobs race mid-restore and export artifacts are not in the envelope.
      await clearTenantBackgroundJobs();
      // Ephemeral workspace log — do not populate target workspace with source backup history.
      collections.backups = [];
    }

    for (const name of sortCollectionNamesForRestore(Object.keys(collections))) {
      throwIfSyncAborted(signal);
      const collectionItems = collections[name];
      if (Array.isArray(collectionItems)) {
        // Admin bulk restore: intentionally replace mirrored relational tables.
        await dbSaveCollection(name, collectionItems, { mirrorRelationalReplace: true });
        restoredCollectionKeys.add(name);
      }
    }

    if (fullRestore) {
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
        // Defense-in-depth: validation already strips these. Never overwrite
        // platform-authoritative grants from a (possibly stale/crafted) payload.
        if (isBackupExcludedObjectKey(key)) continue;
        if (skipLegacySetupObjects.has(key)) continue;
        if (key === 'branding') {
          const tenant = getRequestTenant();
          if (tenant) {
            const { upsertWorkspaceBranding } = await import('../db/repositories/workspaceRepository.js');
            const { mergeBrandingSettings } = await import('@mms/shared');
            await upsertWorkspaceBranding(tenant, mergeBrandingSettings(objectValue as Record<string, unknown>));
          }
        } else if (key === 'global_settings') {
          const tenant = getRequestTenant();
          if (tenant) {
            const { upsertWorkspaceGlobalSettings } = await import('../db/repositories/workspaceRepository.js');
            const { mergeGlobalSettings } = await import('@mms/shared');
            await upsertWorkspaceGlobalSettings(tenant, mergeGlobalSettings(objectValue as Record<string, unknown>));
          }
        } else if (key === 'email_integration') {
          const tenant = getRequestTenant();
          if (tenant) {
            const { saveEmailIntegrationConfig } = await import('./email/emailIntegrationService.js');
            const { mergeEmailIntegrationConfig } = await import('@mms/shared');
            await saveEmailIntegrationConfig(mergeEmailIntegrationConfig(objectValue as Record<string, unknown>));
          }
        }
        await dbSaveObject(key, objectValue);
        restoredKeys.add(key);
      }

      if (fullRestore) {
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
    } else if (fullRestore) {
      for (const key of BACKUP_EPHEMERAL_OBJECT_KEYS) {
        await dbDeleteObject(key);
      }
    }

    if (fullRestore) {
      const tenant = getRequestTenant();
      if (tenant) {
        await verifyPostRestoreIntegrity(tenant);
      }
    }

    if (payload.assets && typeof payload.assets === 'object' && Object.keys(payload.assets).length > 0) {
      const { restoreTenantAssets } = await import('./backupAssetService.js');
      await restoreTenantAssets(payload.assets);
    }
  });
}

/**
 * Validates post-restore state before committing the database transaction.
 * Ensures the tenant retains at least one active administrator.
 */
async function verifyPostRestoreIntegrity(subdomain: string): Promise<void> {
  const { listAllTenantUsersByWorkspace } = await import('../db/repositories/tenantUserRepository.js');
  const users = await listAllTenantUsersByWorkspace(subdomain);
  if (users.length > 0) {
    const hasAdmin = users.some((u) => u.role === 'admin' && !u.deletedAt);
    if (!hasAdmin) {
      throw new Error('backup.missingAdminUser');
    }
  }
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
