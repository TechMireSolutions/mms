import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
  ObligationsCommandMetricsSnapshot,
} from '@mms/shared';
import { OBLIGATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const OBLIGATIONS_TYPES_QUERY_KEY = ['obligations', 'types', 'list'] as const;
export const OBLIGATIONS_MUJTAHIDS_QUERY_KEY = ['obligations', 'mujtahids', 'list'] as const;
export const OBLIGATIONS_REPS_QUERY_KEY = ['obligations', 'reps', 'list'] as const;
export const OBLIGATIONS_WAKALA_QUERY_KEY = ['obligations', 'wakala', 'list'] as const;
export const OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY = ['obligations', 'distributions', 'list'] as const;
export const OBLIGATIONS_COLLECTIONS_QUERY_KEY = ['obligations', 'collections', 'list'] as const;
export const OBLIGATIONS_METRICS_QUERY_KEY = ['obligations', 'metrics'] as const;

const OBLIGATIONS_API = OBLIGATIONS_MODULE_CONTRACT.restBasePath;

export function useObligationsTypes(options?: { enabled?: boolean }) {
  return useCollectionSync<ObligationType>({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/types`,
    responseKey: 'types',
    collectionName: 'obligation_types',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsTypesCollection(options?: { enabled?: boolean }): ObligationType[] {
  return useCollectionSync<ObligationType>({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/types`,
    responseKey: 'types',
    collectionName: 'obligation_types',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsMujtahids(options?: { enabled?: boolean }) {
  return useCollectionSync<Mujtahid>({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/mujtahids`,
    responseKey: 'mujtahids',
    collectionName: 'mujtahids',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsMujtahidsCollection(options?: { enabled?: boolean }): Mujtahid[] {
  return useCollectionSync<Mujtahid>({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/mujtahids`,
    responseKey: 'mujtahids',
    collectionName: 'mujtahids',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsReps(options?: { enabled?: boolean }) {
  return useCollectionSync<MujtahidRep>({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/reps`,
    responseKey: 'reps',
    collectionName: 'mujtahid_reps',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsRepsCollection(options?: { enabled?: boolean }): MujtahidRep[] {
  return useCollectionSync<MujtahidRep>({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/reps`,
    responseKey: 'reps',
    collectionName: 'mujtahid_reps',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsWakala(options?: { enabled?: boolean }) {
  return useCollectionSync<WakalaType>({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/wakala`,
    responseKey: 'wakalaTypes',
    collectionName: 'wakala_types',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsWakalaCollection(options?: { enabled?: boolean }): WakalaType[] {
  return useCollectionSync<WakalaType>({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/wakala`,
    responseKey: 'wakalaTypes',
    collectionName: 'wakala_types',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsDistributions(options?: { enabled?: boolean }) {
  return useCollectionSync<ObligationDistribution>({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/distributions`,
    responseKey: 'distributions',
    collectionName: 'obligation_distributions',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsDistributionsCollection(options?: { enabled?: boolean }): ObligationDistribution[] {
  return useCollectionSync<ObligationDistribution>({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/distributions`,
    responseKey: 'distributions',
    collectionName: 'obligation_distributions',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsCollections(options?: { enabled?: boolean }) {
  return useCollectionSync<ObligationCollection>({
    queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/collections`,
    responseKey: 'collections',
    collectionName: 'obligation_collections',
    enabled: options?.enabled,
  }).queryResult;
}

export function useObligationsCollectionsCollection(options?: { enabled?: boolean }): ObligationCollection[] {
  return useCollectionSync<ObligationCollection>({
    queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/collections`,
    responseKey: 'collections',
    collectionName: 'obligation_collections',
    enabled: options?.enabled,
  }).syncedData;
}

export function useObligationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ObligationsCommandMetricsSnapshot>({
    moduleId: OBLIGATIONS_MODULE_CONTRACT.moduleId,
    apiPath: OBLIGATIONS_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
  });
}

export function useObligationsMutations() {
  const queryClient = useQueryClient();

  const replaceTypes = useMutation({
    mutationFn: async (types: ObligationType[]) =>
      apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types/bulk`, {
        method: 'PUT',
        body: JSON.stringify(types),
      }),
    onSuccess: (typesResponse) => {
      saveCollection('obligation_types', typesResponse.types);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_TYPES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceMujtahids = useMutation({
    mutationFn: async (mujtahids: Mujtahid[]) =>
      apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids/bulk`, {
        method: 'PUT',
        body: JSON.stringify(mujtahids),
      }),
    onSuccess: (mujtahidsResponse) => {
      saveCollection('mujtahids', mujtahidsResponse.mujtahids);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceReps = useMutation({
    mutationFn: async (reps: MujtahidRep[]) =>
      apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps/bulk`, {
        method: 'PUT',
        body: JSON.stringify(reps),
      }),
    onSuccess: (repsResponse) => {
      saveCollection('mujtahid_reps', repsResponse.reps);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_REPS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceWakala = useMutation({
    mutationFn: async (wakalaTypes: WakalaType[]) =>
      apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala/bulk`, {
        method: 'PUT',
        body: JSON.stringify(wakalaTypes),
      }),
    onSuccess: (wakalaResponse) => {
      saveCollection('wakala_types', wakalaResponse.wakalaTypes);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_WAKALA_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceDistributions = useMutation({
    mutationFn: async (distributions: ObligationDistribution[]) =>
      apiJson<{ distributions: ObligationDistribution[] }>(`${OBLIGATIONS_API}/distributions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(distributions),
      }),
    onSuccess: (distributionsResponse) => {
      saveCollection('obligation_distributions', distributionsResponse.distributions);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceCollections = useMutation({
    mutationFn: async (collections: ObligationCollection[]) =>
      apiJson<{ collections: ObligationCollection[] }>(`${OBLIGATIONS_API}/collections/bulk`, {
        method: 'PUT',
        body: JSON.stringify(collections),
      }),
    onSuccess: (collectionsResponse) => {
      saveCollection('obligation_collections', collectionsResponse.collections);
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  return {
    replaceTypes,
    replaceMujtahids,
    replaceReps,
    replaceWakala,
    replaceDistributions,
    replaceCollections,
  };
}
