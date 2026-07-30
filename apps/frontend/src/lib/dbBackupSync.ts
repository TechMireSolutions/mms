import { apiFetch } from "@/lib/apiClient";
import {
  buildWorkspaceBackupEnvelope,
  buildStorageKeysFromSnapshot,
  parseStorageKeysToSnapshot,
  validateWorkspaceBackupJson,
  encryptWorkspaceBackup,
  type TenantDatabaseSnapshot,
  type BackupCredentials,
  type WorkspaceBackupStats,
  type WorkspaceBackupEnvelope,
} from "@mms/shared";
import { getCurrentSubdomain } from "@/lib/config/tenantConfig";
import {
  clearByPrefix,
  dispatchLocalDatabaseUpdate,
  getHeaders,
  getStoragePrefix,
  safeSetItem,
  syncToServer,
} from "@/lib/dbStorageCore.js";

export async function fetchTenantSnapshot(): Promise<TenantDatabaseSnapshot> {
  const response = await apiFetch("/api/db/sync", {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("backup.serverForbidden");
    }
    throw new Error("backup.serverFetchFailed");
  }

  return (await response.json()) as TenantDatabaseSnapshot;
}

/**
 * Writes a server snapshot into the scoped localStorage cache.
 */
export function applySnapshotToLocalCache(snapshot: TenantDatabaseSnapshot): void {
  const prefix = getStoragePrefix();
  const keys = buildStorageKeysFromSnapshot(snapshot, prefix);
  for (const [key, value] of Object.entries(keys)) {
    safeSetItem(key, value);
  }

  dispatchLocalDatabaseUpdate();
}

/**
 * Performs a complete synchronization pull from the backend.
 * Downloads all collections and objects, updates the local cache, and notifies observers.
 *
 * @returns {Promise<void>}
 */
export async function syncDatabase(): Promise<void> {
  try {
    const tenantSnapshot = await fetchTenantSnapshot();
    applySnapshotToLocalCache(tenantSnapshot);
  } catch (error) {
    console.error("Failed to sync database with backend:", error);
  }
}

/**
 * Exports a full tenant backup from the server (PostgreSQL), not browser cache alone.
 * Refreshes localStorage from the server snapshot before building the file.
 */
export async function exportTenantBackup(): Promise<string> {
  const snapshot = await fetchTenantSnapshot();
  applySnapshotToLocalCache(snapshot);

  const prefix = getStoragePrefix();
  const keys = buildStorageKeysFromSnapshot(snapshot, prefix);
  const subdomain = getCurrentSubdomain();

  return buildWorkspaceBackupEnvelope(keys, { subdomain, dataSource: "server" });
}

export async function importDatabase(jsonString: string): Promise<void> {
  try {
    const prefix = getStoragePrefix();
    const validated = validateWorkspaceBackupJson(jsonString, prefix);
    if (!validated.ok) {
      throw new Error(validated.errorKey);
    }

    const { collections, objects } = parseStorageKeysToSnapshot(validated.data, prefix);

    // Pushes backup bulk sync to backend first. If this fails, the local cache remains untouched.
    const result = await syncToServer("/api/db/sync", { collections, objects });
    if (!result.ok) {
      throw new Error("backup.serverRestoreFailed");
    }

    // Clear old client cache only after backend success
    clearByPrefix(prefix);

    // Populate new client cache
    for (const [key, value] of Object.entries(validated.data)) {
      safeSetItem(key, value);
    }

    dispatchLocalDatabaseUpdate();
  } catch (error) {
    console.error("Error importing database:", error);
    throw error;
  }
}

/**
 * Exports a full tenant backup from the server (PostgreSQL) and encrypts it using admin credentials.
 */
export async function exportEncryptedTenantBackup(
  credentials: BackupCredentials,
  tenantLabel: string,
): Promise<{ encrypted: string; stats: WorkspaceBackupStats }> {
  const plaintext = await exportTenantBackup();
  const envelope = JSON.parse(plaintext) as WorkspaceBackupEnvelope;
  const subdomain = getCurrentSubdomain();
  const encrypted = await encryptWorkspaceBackup(plaintext, credentials, { subdomain, tenantLabel });
  return { encrypted, stats: envelope.stats };
}
