import { useLiveCollection } from './useLiveCollection';

export interface UseSyncedCollectionOptions<T> {
  queryData: T[] | undefined;
  isSuccess: boolean;
  collectionName: string;
  defaultData?: T[];
  enabled?: boolean;
}

/**
 * A custom React hook that coordinates query-first fetching with localStorage fallback.
 * It encapsulates the pattern:
 * 1. Checks if the TanStack query was successful and has data.
 * 2. If yes, returns the query data.
 * 3. If no, falls back to the reactive local db collection.
 */
export function useSyncedCollection<T>({
  queryData,
  isSuccess,
  collectionName,
  defaultData = [],
  enabled = true,
}: UseSyncedCollectionOptions<T>): T[] {
  const localData = useLiveCollection<T>(collectionName, defaultData, { enabled });
  if (!enabled) return [];
  if (isSuccess && queryData) {
    return queryData;
  }
  return localData;
}
