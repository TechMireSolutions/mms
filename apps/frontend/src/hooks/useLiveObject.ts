import { useState, useEffect, useCallback, useRef } from "react";
import { getObject } from "@/lib/db";

/**
 * A custom React hook that reads a local database object and subscribes to
 * the 'local-database-update' event, returning a reactive state representation
 * that updates instantly when writes occur.
 *
 * @template T
 * @param {string} dbKey - The storage key representing the object name.
 * @param {T} defaultData - Seeding and fallback data if the object is uninitialized.
 * @returns {T} The reactive, live object data.
 */
export function useLiveObject<T = any>(
  dbKey: string,
  defaultData: T,
  options?: { loadFn?: (key: string, fallback: T) => T },
): T {
  const defaultDataRef = useRef(defaultData);
  defaultDataRef.current = defaultData;
  const loadFnRef = useRef(options?.loadFn);
  loadFnRef.current = options?.loadFn;

  const loadValue = useCallback((): T => {
    if (loadFnRef.current) {
      return loadFnRef.current(dbKey, defaultDataRef.current);
    }
    return getObject<T>(dbKey, defaultDataRef.current);
  }, [dbKey]);

  const [data, setData] = useState<T>(() => loadValue());

  const handleUpdate = useCallback((): void => {
    setData(loadValue());
  }, [loadValue]);

  useEffect(() => {
    handleUpdate();

    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [handleUpdate]);

  return data;
}
