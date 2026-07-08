import { useState, useEffect, useRef } from "react";
import { getCollection, hasCollectionInCache, saveCollectionCacheOnly } from "@/lib/db";
import { apiFetch } from "@/lib/apiClient";

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
export function useLiveCollection<T = any>(
  dbKey: string,
  defaultData: T[] = [] as T[],
  options?: { enabled?: boolean; serverSync?: boolean },
): T[] {
  const enabled = options?.enabled ?? true;
  const serverSync = options?.serverSync ?? true;
  const defaultDataRef = useRef(defaultData);
  defaultDataRef.current = defaultData;

  const [data, setData] = useState<T[]>(() =>
    enabled ? getCollection<T>(dbKey, defaultDataRef.current) : ([] as T[]),
  );

  useEffect(() => {
    if (!enabled) {
      setData([] as T[]);
      return;
    }

    const handleUpdate = (): void => {
      setData(getCollection<T>(dbKey, defaultDataRef.current));
    };

    handleUpdate();

    const isAuth = typeof window !== "undefined" && localStorage.getItem("mms_user") !== null;
    if (isAuth && serverSync && !hasCollectionInCache(dbKey)) {
      apiFetch(`/api/db/collections/${dbKey}`)
        .then(async (res) => {
          if (res.ok) {
            const fetched = await res.json() as T[];
            saveCollectionCacheOnly(dbKey, fetched);
          } else {
            console.warn(`Failed to fetch collection "${dbKey}" on-demand (status: ${res.status})`);
          }
        })
        .catch((error) => {
          console.error(`Error fetching collection "${dbKey}" on-demand:`, error);
        });
    }

    window.addEventListener("local-database-update", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
    };
  }, [dbKey, enabled]);

  if (!enabled) return [] as T[];
  return data;
}
