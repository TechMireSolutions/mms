import { apiFetch } from "@/lib/apiClient";
import { validateSessions } from "@/lib/data/sessionsData";
import {
  type BrandingSettings,
  type GlobalSettings,
  type PublicBranding,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  mergeBrandingSettings,
  mergeGlobalSettings,
  formatDate,
  tenantLocalStoragePrefix,
  validateWorkspaceBackupJson,
  buildWorkspaceBackupEnvelope,
  buildStorageKeysFromSnapshot,
  parseStorageKeysToSnapshot,
  type TenantDatabaseSnapshot,
  applyTitleCaseRecursive,
  registerSettingsProvider,
  encryptWorkspaceBackup,
  type BackupCredentials,
  type WorkspaceBackupStats,
  type WorkspaceBackupEnvelope,
} from "@mms/shared";
import { getCurrentSubdomain } from "@/lib/config/tenantConfig";
import {
  hydrateCollectionRows,
  normalizeCollectionRows,
} from "@/lib/contactLink/collectionSync";
import type { ContactLike } from "@mms/shared";


// Replaced local key mapping configs with imports from @mms/shared (DRY)

const LINK_MANAGED_COLLECTIONS = new Set([
  "students",
  "teachers",
  "enrollments",
  "attendance_records",
  "finance_invoices",
  "finance_payments",
  "sessions",
  "users",
  "user_activity_logs",
  "hasanat_distributions",
  "hasanat_redemptions",
  "assessment_results",
  "exam_results",
  "hasanat_payouts",
  "hasanat_batches",
]);

type CollectionRow = Record<string, unknown>;

function readRawCollection<T = CollectionRow>(key: string): T[] {
  try {
    const saved = localStorage.getItem(scopedStorageKey(key));
    if (saved === null || saved === "undefined") return [];
    const parsed = JSON.parse(saved) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function getLinkHydrationContext() {
  const contacts = readRawCollection<ContactLike>("contacts");
  const rawStudents = readRawCollection("students");
  const rawTeachers = readRawCollection("teachers");
  const base = {
    contacts,
    students: [] as CollectionRow[],
    teachers: [] as CollectionRow[],
    users: [] as CollectionRow[],
    distributions: [] as CollectionRow[],
  };
  const students = hydrateCollectionRows("students", rawStudents, base);
  const teachers = hydrateCollectionRows("teachers", rawTeachers, base);
  const users = hydrateCollectionRows(
    "users",
    readRawCollection("users"),
    { ...base, students, teachers },
  );
  return {
    contacts,
    students,
    teachers,
    users,
    distributions: readRawCollection("hasanat_distributions"),
  };
}

function hydrateLinkedCollection<T>(key: string, rows: T[]): T[] {
  if (!LINK_MANAGED_COLLECTIONS.has(key)) return rows;
  return hydrateCollectionRows(key, rows as CollectionRow[], getLinkHydrationContext()) as T[];
}

function normalizeLinkedCollection<T>(key: string, rows: T[]): T[] {
  if (!LINK_MANAGED_COLLECTIONS.has(key)) return rows;
  return normalizeCollectionRows(key, rows as CollectionRow[]) as T[];
}

/** Active workspace localStorage key prefix (`mms_` on apex, `mms_t:{slug}:` on tenant). */
export function getWorkspaceLocalStoragePrefix(): string {
  const subdomain = getCurrentSubdomain();
  return subdomain ? tenantLocalStoragePrefix(subdomain) : "mms_";
}

function getStoragePrefix(): string {
  return getWorkspaceLocalStoragePrefix();
}

function scopedStorageKey(key: string): string {
  return `${getStoragePrefix()}${key}`;
}

// ─── Sync Status ─────────────────────────────────────────────────────────────

/** Possible states of the background server synchronization. */
export type SyncStatus = 'idle' | 'syncing' | 'error';

let _syncStatus: SyncStatus = 'idle';

/**
 * Returns the current background sync status.
 *
 * @returns {SyncStatus} The current sync status.
 */
export function getSyncStatus(): SyncStatus {
  return _syncStatus;
}

function setSyncStatus(status: SyncStatus): void {
  _syncStatus = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-status-change', { detail: status }));
  }
}

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Performs a background write to the server and tracks sync status.
 *
 * @param {string} url - API endpoint URL.
 * @param {unknown} body - Object or Array to send.
 * @returns {Promise<void>}
 */
export interface ServerSyncResult {
  ok: boolean;
  status?: number;
}

async function syncToServer(url: string, body: unknown, method: string = "POST"): Promise<ServerSyncResult> {
  try {
    setSyncStatus('syncing');
    const response = await apiFetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const expectedPreAuth =
        response.status === 401 && localStorage.getItem('mms_user') === null;
      if (!expectedPreAuth) {
        console.warn(`Sync to server failed for ${url} (status: ${response.status})`);
      }
      setSyncStatus(expectedPreAuth ? 'idle' : 'error');
      return { ok: false, status: response.status };
    }
    setSyncStatus('idle');
    return { ok: true };
  } catch (error) {
    console.error(`Network error during background sync for ${url}:`, error);
    setSyncStatus('error');
    return { ok: false };
  }
}

/**
 * Downloads the authoritative tenant snapshot from PostgreSQL (admin-only).
 */
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

function dispatchLocalDatabaseUpdate(): void {
  if (typeof window !== "undefined") {
    setTimeout(() => {
      window.dispatchEvent(new Event("local-database-update"));
    }, 0);
  }
}

/**
 * Safely writes a key-value pair to localStorage, handling quota exceptions.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`LocalStorage quota exceeded for key "${key}", skipping local cache write.`, err);
  }
}

/**
 * Removes all keys starting with the specified prefix from localStorage.
 */
function clearByPrefix(prefix: string): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
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

const BUSINESS_COLLECTIONS = new Set([
  "overdue_obligations",
  "messages",
  "contacts",
  "students",
  "teachers",
  "enrollments",
  "attendance_records",
  "finance_invoices",
  "finance_payments",
  "sessions",
  "users",
  "user_activity_logs",
  "hasanat_distributions",
  "hasanat_redemptions",
  "hasanat_denoms",
  "hasanat_batches",
  "hasanat_payouts",
  "assessment_results",
  "exam_results",
  "exams",
  "questions",
  "tests",
  "obligation_collections",
  "obligation_distributions",
  "obligation_types",
  "mujtahids",
  "mujtahid_reps",
  "wakala_types",
  "accounting_accounts",
  "accounting_entries",
  "accounting_fiscal_years",
  "currencies",
  "genders",
  "studentStatuses",
  "studentGenderFilters",
  "studentDiscountTypes",
  "socialPlatforms",
  "relationships",
  "whatsappTemplates",
  "phoneLabels",
  "emailLabels",
  "addressLabels",
  "countryCodes",
  "teacherStatuses",
  "teacherSpecializations",
  "sessionStatuses",
  "sessionTypes",
  "attendanceStatuses",
]);

/**
 * Checks if a collection key exists in local storage.
 *
 * @param {string} key - The collection key.
 * @returns {boolean} True if the collection exists in cache.
 */
export function hasCollectionInCache(key: string): boolean {
  try {
    return localStorage.getItem(scopedStorageKey(key)) !== null;
  } catch {
    return false;
  }
}

/**
 * Saves a collection ONLY to local storage (does not sync to server).
 * Used when caching data that was fetched from the server.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T[]} collectionItems - Collection items to save.
 * @returns {void}
 */
export function saveCollectionCacheOnly<T>(key: string, collectionItems: T[]): void {
  try {
    let dataToSave = collectionItems;
    if (key === "sessions") {
      dataToSave = validateSessions(collectionItems) as unknown as T[];
    }
    dataToSave = normalizeLinkedCollection(key, dataToSave);
    dataToSave = applyTitleCaseRecursive(dataToSave) as T[];
    safeSetItem(scopedStorageKey(key), JSON.stringify(dataToSave));
    dispatchLocalDatabaseUpdate();
  } catch (error) {
    console.error(`Error saving collection "${key}" to local cache:`, error);
  }
}

/**
 * Retrieves a collection from localStorage. If not found, seeds it with the provided default data.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T[]} defaultData - Fallback data used if the collection does not exist.
 * @returns {T[]} The loaded collection.
 */
export function getCollection<T = unknown>(key: string, defaultData: T[] = [] as T[]): T[] {
  try {
    const saved = localStorage.getItem(scopedStorageKey(key));
    if (saved !== null && saved !== "undefined") {
      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          let collection = parsed as T[];
          if (key === "sessions") {
            collection = validateSessions(collection) as unknown as T[];
          }
          collection = hydrateLinkedCollection(key, collection);
          return collection;
        }
      } catch {
        console.warn(`Failed to parse cached collection "${key}", resetting to default.`);
      }
    }
    const isAuth = typeof window !== "undefined" && localStorage.getItem("mms_user") !== null;
    if (isAuth && (BUSINESS_COLLECTIONS.has(key) || key.startsWith("messages_u:"))) {
      return [] as T[];
    }
    if (defaultData.length === 0) {
      return [];
    }
    let dataToSave = defaultData;
    if (key === "sessions") {
      dataToSave = validateSessions(defaultData) as unknown as T[];
    }
    dataToSave = normalizeLinkedCollection(key, dataToSave);
    safeSetItem(scopedStorageKey(key), JSON.stringify(dataToSave));

    // Defer so reads during render (e.g. useLiveCollection init) don't update other components synchronously
    queueMicrotask(() => {
      void syncToServer(`/api/db/collections/${key}`, dataToSave);
    });

    let seedData = hydrateLinkedCollection(key, dataToSave);
    if (key === "sessions") {
      seedData = validateSessions(seedData) as unknown as T[];
      seedData = hydrateLinkedCollection(key, seedData);
    }
    return seedData;
  } catch (error) {
    console.error(`Error reading collection "${key}" from database:`, error);
    return defaultData;
  }
}

/**
 * Saves a collection to localStorage and synchronizes in background with backend.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T[]} collectionItems - Collection items to save.
 * @returns {void}
 */
export function saveCollection<T>(key: string, collectionItems: T[]): void {
  try {
    let dataToSave = collectionItems;
    if (key === "sessions") {
      dataToSave = validateSessions(collectionItems) as unknown as T[];
    }
    dataToSave = normalizeLinkedCollection(key, dataToSave);
    dataToSave = applyTitleCaseRecursive(dataToSave) as T[];
    safeSetItem(scopedStorageKey(key), JSON.stringify(dataToSave));
    dispatchLocalDatabaseUpdate();

    // Sync to backend asynchronously
    void syncToServer(`/api/db/collections/${key}`, dataToSave);
  } catch (error) {
    console.error(`Error writing collection "${key}" to database:`, error);
  }
}

/**
 * Retrieves a single object/record from localStorage. If not found, seeds it.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T} defaultData - Fallback data.
 * @returns {T} The loaded object.
 */
export function getObject<T>(key: string, defaultData: T): T {
  try {
    const saved = localStorage.getItem(scopedStorageKey(key));
    if (saved !== null && saved !== "undefined") {
      try {
        return JSON.parse(saved) as T;
      } catch {
        console.warn(`Failed to parse cached object "${key}", resetting to default.`);
      }
    }
    safeSetItem(scopedStorageKey(key), JSON.stringify(defaultData));

    return defaultData;
  } catch (error) {
    console.error(`Error reading object "${key}" from database:`, error);
    return defaultData;
  }
}

/** Reads `global_settings` merged with defaults (incl. all `enabledModules` keys). */
export function getGlobalSettings(): GlobalSettings {
  return mergeGlobalSettings(getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS));
}

let globalSettingsPreview: Partial<GlobalSettings> | null = null;

/** Merges a live-preview patch (Settings panels) without persisting. */
export function mergeGlobalSettingsPreview(patch: Partial<GlobalSettings> | null): void {
  if (patch === null) {
    globalSettingsPreview = null;
    return;
  }
  globalSettingsPreview = {
    ...globalSettingsPreview,
    ...patch,
    ...(patch.enabledModules
      ? { enabledModules: { ...globalSettingsPreview?.enabledModules, ...patch.enabledModules } }
      : {}),
  };
}

/** Clears the in-memory global settings preview overlay. */
export function clearGlobalSettingsPreviewOverlay(): void {
  globalSettingsPreview = null;
}

/** Persisted `global_settings` merged with any active preview overlay. */
export function getEffectiveGlobalSettings(): GlobalSettings {
  return mergeGlobalSettings({
    ...getGlobalSettings(),
    ...(globalSettingsPreview ?? {}),
  });
}

// Register settings provider for shared formatters to be settings/preview-aware.
registerSettingsProvider(() => {
  const settings = getEffectiveGlobalSettings();
  return {
    dateFormat: settings.dateFormat,
    timezone: settings.timezone,
    language: settings.language,
  };
});

/** Persists merged global settings and dispatches `local-database-update`. */
export function saveGlobalSettings(globalSettings: GlobalSettings): void {
  saveObject("global_settings", mergeGlobalSettings(globalSettings));
}

/** Persists global settings locally and waits for PostgreSQL sync. */
export async function saveGlobalSettingsAsync(globalSettings: GlobalSettings): Promise<ServerSyncResult> {
  const merged = mergeGlobalSettings(globalSettings);
  try {
    const processed = writeObjectLocal("global_settings", merged);
    return await syncToServer("/api/db/objects/global_settings", processed);
  } catch (error) {
    console.error("Error writing global_settings to local database:", error);
    return { ok: false };
  }
}

/** Reads `branding` merged with defaults. */
export function getBrandingSettings(): BrandingSettings {
  return mergeBrandingSettings(getObject<BrandingSettings>("branding", DEFAULT_BRANDING_SETTINGS));
}

let brandingPreview: Partial<BrandingSettings> | null = null;

/** Merges a live-preview patch (Settings panels) without persisting. */
export function mergeBrandingSettingsPreview(patch: Partial<BrandingSettings> | null): void {
  brandingPreview = patch === null ? null : { ...brandingPreview, ...patch };
}

/** Clears the in-memory branding preview overlay. */
export function clearBrandingSettingsPreviewOverlay(): void {
  brandingPreview = null;
}

/** Persisted `branding` merged with any active preview overlay. */
export function getEffectiveBrandingSettings(): BrandingSettings {
  return mergeBrandingSettings({
    ...getBrandingSettings(),
    ...(brandingPreview ?? {}),
  });
}

const TITLE_CASE_EXCLUDED_KEYWORDS = [
  "settings",
  "config",
  "widgets",
  "preferences",
  "visuals",
  "cards",
  "categories",
  "sourcebooks",
  "template",
  "tabs",
  "placeholders",
  "draft",
  "backup",
];

function shouldSkipTitleCase(key: string): boolean {
  const lk = key.toLowerCase();
  return TITLE_CASE_EXCLUDED_KEYWORDS.some((kw) => lk.includes(kw));
}

function writeObjectLocal<T>(key: string, objectValue: T): T {
  const processed = shouldSkipTitleCase(key) ? objectValue : (applyTitleCaseRecursive(objectValue) as T);
  safeSetItem(scopedStorageKey(key), JSON.stringify(processed));
  dispatchLocalDatabaseUpdate();
  return processed;
}


/**
 * Persists merged branding locally and waits for PostgreSQL sync to complete.
 */
export async function saveBrandingSettings(brandingSettings: BrandingSettings): Promise<ServerSyncResult> {
  const merged = mergeBrandingSettings(brandingSettings);
  try {
    const processed = writeObjectLocal("branding", merged);
    return await syncToServer("/api/db/objects/branding", processed);
  } catch (error) {
    console.error('Error writing branding to local database:', error);
    return { ok: false };
  }
}

/** Reads a stored object without seeding defaults (for pre-auth branding prefetch). */
export function readObjectLocal<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(scopedStorageKey(key));
    if (saved !== null && saved !== "undefined") {
      try {
        return JSON.parse(saved) as T;
      } catch {
        console.warn(`Failed to parse cached object "${key}"`);
      }
    }
  } catch (error) {
    console.error(`Error reading object "${key}" from local cache:`, error);
  }
  return null;
}

/** Merges public branding from the workspace API into the local branding object (login prefetch). */
export function cachePublicBranding(partial: PublicBranding): void {
  const existing = mergeBrandingSettings(
    readObjectLocal<BrandingSettings>("branding") ?? DEFAULT_BRANDING_SETTINGS,
  );
  writeObjectLocal("branding", mergeBrandingSettings({ ...existing, ...partial }));
}

/**
 * Saves a single object/record to localStorage and synchronizes in background with backend.
 *
 * @template T
 * @param {string} key - Unique key for storage.
 * @param {T} data - Object data to save.
 * @returns {void}
 */
export function saveObject<T>(key: string, objectValue: T): void {
  try {
    const processed = writeObjectLocal(key, objectValue);
    void syncToServer(`/api/db/objects/${key}`, processed);
  } catch (error) {
    console.error(`Error writing object "${key}" to database:`, error);
  }
}

/**
 * Clears all existing "mms_" keys from localStorage, parses
 * the provided JSON string, imports the stored key-value pairs and pushes to backend.
 *
 * @param {string} jsonString - The serialized database JSON string.
 * @returns {Promise<void>}
 */
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

/**
 * Formats a Date object or date string according to the active global date format.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {boolean} [showMonthName] - Whether to show the short month name instead of numeric.
 * @returns {string} The formatted date string.
 */
// Re-export settings-aware formatDate helper directly from @mms/shared
export { formatDate };
