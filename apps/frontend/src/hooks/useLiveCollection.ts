import { useState, useEffect, useCallback, useRef } from "react";
import { getCollection, hasCollectionInCache, saveCollectionCacheOnly } from "@/lib/db";
import { apiFetch } from "@/lib/apiClient";
import { reportClientError } from "@/lib/clientErrorReporting";

const EMPTY_ARRAY: unknown[] = [];

/**
 * A custom React hook that reads a local database collection and subscribes to
 * the 'local-database-update' event, returning a reactive state representation
 * that updates instantly when writes occur.
 *
 * @template T
 * @param {string} dbKey - The storage key representing the collection name.
 * @param {T[]} defaultData - Seeding and fallback data if the collection is uninitialized.
 * @returns {T[]} The reactive, live collection data array.
 */
export function useLiveCollection<T = unknown>(
  dbKey: string,
  defaultData: T[] = EMPTY_ARRAY as T[],
  options?: { enabled?: boolean; serverSync?: boolean },
): T[] {
  const enabled = options?.enabled ?? true;
  const serverSync = options?.serverSync ?? true;
  const defaultDataRef = useRef(defaultData);
  defaultDataRef.current = defaultData;

  const handleUpdate = useCallback((): void => {
    setData(getCollection<T>(dbKey, defaultDataRef.current));
  }, [dbKey]);

  const [data, setData] = useState<T[]>(() =>
    enabled ? getCollection<T>(dbKey, defaultDataRef.current) : (EMPTY_ARRAY as T[]),
  );

  useEffect(() => {
    if (!enabled) {
      setData(EMPTY_ARRAY as T[]);
      return;
    }

    handleUpdate();

    const isAuth = typeof window !== "undefined" && localStorage.getItem("mms_user") !== null;
    if (isAuth && serverSync && !hasCollectionInCache(dbKey)) {
      apiFetch(`/api/db/collections/${dbKey}`)
        .then(async (res) => {
          if (res.ok) {
            const fetched = (await res.json()) as T[];
            saveCollectionCacheOnly(dbKey, fetched);
          }
        })
        .catch((error) => {
          reportClientError(error, { scope: "useLiveCollection.fetch", dbKey });
        });
    }

    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [dbKey, enabled, serverSync, handleUpdate]);

  if (!enabled) return EMPTY_ARRAY as T[];
  return data;
}
