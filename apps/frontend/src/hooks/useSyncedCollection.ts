import { useLiveCollection } from './useLiveCollection';

export interface UseSyncedCollectionOptions<T> {
  queryData: T[] | undefined;
  isSuccess: boolean;
  collectionName: string;
  defaultData?: T[];
  enabled?: boolean;
}

const EMPTY_ARRAY: unknown[] = [];

/**
 * A custom React hook that coordinates query-first fetching with localStorage fallback.
 * It encapsulates the pattern:
 * 1. Checks if the TanStack query was successful (including empty arrays).
 * 2. If yes, returns the query data as authoritative.
 * 3. If no, falls back to the reactive local db collection.
 */
export function useSyncedCollection<T>({
  queryData,
  isSuccess,
  collectionName,
  defaultData = EMPTY_ARRAY as T[],
  enabled = true,
}: UseSyncedCollectionOptions<T>): T[] {
  const localData = useLiveCollection<T>(collectionName, defaultData, { enabled });
  if (!enabled) return EMPTY_ARRAY as T[];
  // Empty arrays are authoritative Query success — do not fall back to stale local.
  return isSuccess && queryData !== undefined ? queryData : localData;
}
