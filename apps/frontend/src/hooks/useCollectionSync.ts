import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useSyncedCollection } from './useSyncedCollection';

export interface UseCollectionSyncOptions<T, R = Record<string, T[]>> {
  queryKey: readonly unknown[];
  apiPath: string;
  responseKey?: keyof R;
  collectionName: string;
  defaultData?: T[];
  staleTime?: number;
  enabled?: boolean;
  isSuccessQuery?: (queryResult: { isSuccess: boolean; data: T[] | undefined }) => boolean;
}

/**
 * A custom React hook that coordinates fetching collection data from the server,
 * saving it to a local collection, and synchronizing with an offline fallback.
 */
export function useCollectionSync<T, R = Record<string, T[]>>({
  queryKey,
  apiPath,
  responseKey,
  collectionName,
  defaultData,
  staleTime = 30_000,
  enabled = true,
  isSuccessQuery,
}: UseCollectionSyncOptions<T, R>) {
  const { isAuthenticated } = useAuth();

  const queryResult = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const response = await apiJson<R>(apiPath);
      const rawData = responseKey && response ? response[responseKey] : response;
      const data = (Array.isArray(rawData) ? rawData : []) as unknown as T[];
      saveCollection(collectionName, data);
      return getCollection<T>(collectionName, data);
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

  return {
    queryResult,
    syncedData,
  };
}
