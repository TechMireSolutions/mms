import { useState, useEffect, useRef } from "react";
import { getCollection } from "../lib/db";

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
  options?: { enabled?: boolean },
): T[] {
  const enabled = options?.enabled ?? true;
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
    window.addEventListener("local-database-update", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
    };
  }, [dbKey, enabled]);

  if (!enabled) return [] as T[];
  return data;
}
