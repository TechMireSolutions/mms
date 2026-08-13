import { validateSessions } from "@/lib/data/sessionsData";
import { applyTitleCaseRecursive } from "@mms/shared";
import {
  dispatchLocalDatabaseUpdate,
  safeSetItem,
  scopedStorageKey,
  syncToServer,
} from "@/lib/dbStorageCore.js";
import {
  hydrateLinkedCollection,
  normalizeLinkedCollection,
} from "@/lib/dbLinkHydration.js";

const BUSINESS_COLLECTIONS = new Set([
  "currencies",
  "backups",
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
    if (isAuth && BUSINESS_COLLECTIONS.has(key)) {
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
 * Saves a collection locally and waits for `/api/db/collections/:key` sync.
 * Throws when the server rejects the write.
 */
export async function saveCollectionAsync<T>(key: string, collectionItems: T[]): Promise<void> {
  let dataToSave = collectionItems;
  if (key === "sessions") {
    dataToSave = validateSessions(collectionItems) as unknown as T[];
  }
  dataToSave = normalizeLinkedCollection(key, dataToSave);
  dataToSave = applyTitleCaseRecursive(dataToSave) as T[];
  safeSetItem(scopedStorageKey(key), JSON.stringify(dataToSave));
  dispatchLocalDatabaseUpdate();

  const result = await syncToServer(`/api/db/collections/${key}`, dataToSave);
  if (!result.ok) {
    throw new Error(`Failed to sync collection "${key}"`);
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
