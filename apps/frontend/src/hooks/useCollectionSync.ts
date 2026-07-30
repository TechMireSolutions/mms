import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollectionCacheOnly } from '@/lib/db';
import { useSyncedCollection } from './useSyncedCollection';

export interface UseCollectionSyncOptions<T, R = Record<string, T[]>> {
  queryKey: readonly unknown[];
  apiPath: string;
  responseKey?: keyof R;
  collectionName: string;
  defaultData?: T[];
  staleTime?: number;
  enabled?: boolean;
  /** When true, mirror Query payloads into localStorage cache. Default false (Query-only). */
  mirrorToLocalCache?: boolean;
  isSuccessQuery?: (queryResult: { isSuccess: boolean; data: T[] | undefined }) => boolean;
}

/**
 * A custom React hook that coordinates fetching collection data from the server,
 * saving it to a local collection, and synchronizing with an offline fallback.
 *
 * REST responses are authoritative: cache locally only — never echo into `/api/db`
 * (that path can wipe table-backed rows such as `tenant_users` after profile strip).
 */
export function useCollectionSync<T, R = Record<string, T[]>>({
  queryKey,
  apiPath,
  responseKey,
  collectionName,
  defaultData,
  staleTime = 30_000,
  enabled = true,
  mirrorToLocalCache = false,
  isSuccessQuery,
}: UseCollectionSyncOptions<T, R>) {
  const { isAuthenticated } = useAuth();

  const queryResult = useQuery<T[]>({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await apiJson<R>(apiPath, { signal });
      const rawData = responseKey && response ? response[responseKey] : response;
      const data = (Array.isArray(rawData) ? rawData : []) as unknown as T[];
      // Cache-only: keep hydrated REST payload for offline fallback; do not POST /api/db.
      if (mirrorToLocalCache) {
        saveCollectionCacheOnly(collectionName, data);
      }
      return data;
    },
    enabled: isAuthenticated && enabled,
    staleTime,
  });

  const syncedData = useSyncedCollection<T>({
    queryData: queryResult.data,
    isSuccess: isSuccessQuery
      ? isSuccessQuery(queryResult)
      : queryResult.isSuccess,
    collectionName,
    defaultData,
    enabled,
  });

  // Prefer authoritative Query data for Work/list; local mirror is offline/report fallback.
  const data = queryResult.data ?? syncedData;

  return {
    queryResult,
    syncedData,
    data,
  };
}
