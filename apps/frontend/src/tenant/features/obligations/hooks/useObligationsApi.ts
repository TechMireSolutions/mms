import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useSyncedCollection } from '@/hooks/useSyncedCollection';

export const OBLIGATIONS_TYPES_QUERY_KEY = ['obligations', 'types', 'list'] as const;
export const OBLIGATIONS_MUJTAHIDS_QUERY_KEY = ['obligations', 'mujtahids', 'list'] as const;
export const OBLIGATIONS_REPS_QUERY_KEY = ['obligations', 'reps', 'list'] as const;
export const OBLIGATIONS_WAKALA_QUERY_KEY = ['obligations', 'wakala', 'list'] as const;
export const OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY = ['obligations', 'distributions', 'list'] as const;
export const OBLIGATIONS_COLLECTIONS_QUERY_KEY = ['obligations', 'collections', 'list'] as const;
export const OBLIGATIONS_METRICS_QUERY_KEY = ['obligations', 'metrics'] as const;

const OBLIGATIONS_API = OBLIGATIONS_MODULE_CONTRACT.restBasePath;

async function fetchTypes(): Promise<ObligationType[]> {
  const typesResponse = await apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types`);
  saveCollection('obligation_types', typesResponse.types);
  return typesResponse.types;
}

async function fetchMujtahids(): Promise<Mujtahid[]> {
  const mujtahidsResponse = await apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids`);
  saveCollection('mujtahids', mujtahidsResponse.mujtahids);
  return mujtahidsResponse.mujtahids;
}

async function fetchReps(): Promise<MujtahidRep[]> {
  const repsResponse = await apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps`);
  saveCollection('mujtahid_reps', repsResponse.reps);
  return repsResponse.reps;
}

async function fetchWakala(): Promise<WakalaType[]> {
  const wakalaResponse = await apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala`);
  saveCollection('wakala_types', wakalaResponse.wakalaTypes);
  return wakalaResponse.wakalaTypes;
}

async function fetchDistributions(): Promise<ObligationDistribution[]> {
  const distributionsResponse = await apiJson<{ distributions: ObligationDistribution[] }>(`${OBLIGATIONS_API}/distributions`);
  saveCollection('obligation_distributions', distributionsResponse.distributions);
  return distributionsResponse.distributions;
}

async function fetchCollections(): Promise<ObligationCollection[]> {
  const collectionsResponse = await apiJson<{ collections: ObligationCollection[] }>(`${OBLIGATIONS_API}/collections`);
  saveCollection('obligation_collections', collectionsResponse.collections);
  return collectionsResponse.collections;
}

export function useObligationsTypes(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    queryFn: fetchTypes,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsTypesCollection(options?: { enabled?: boolean }): ObligationType[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsTypes({ enabled });
  return useSyncedCollection<ObligationType>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'obligation_types',
    enabled,
  });
}

export function useObligationsMujtahids(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    queryFn: fetchMujtahids,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsMujtahidsCollection(options?: { enabled?: boolean }): Mujtahid[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsMujtahids({ enabled });
  return useSyncedCollection<Mujtahid>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'mujtahids',
    enabled,
  });
}

export function useObligationsReps(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    queryFn: fetchReps,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsRepsCollection(options?: { enabled?: boolean }): MujtahidRep[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsReps({ enabled });
  return useSyncedCollection<MujtahidRep>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'mujtahid_reps',
    enabled,
  });
}

export function useObligationsWakala(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    queryFn: fetchWakala,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsWakalaCollection(options?: { enabled?: boolean }): WakalaType[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsWakala({ enabled });
  return useSyncedCollection<WakalaType>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'wakala_types',
    enabled,
  });
}

export function useObligationsDistributions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    queryFn: fetchDistributions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsDistributionsCollection(options?: { enabled?: boolean }): ObligationDistribution[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsDistributions({ enabled });
  return useSyncedCollection<ObligationDistribution>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'obligation_distributions',
    enabled,
  });
}

export function useObligationsCollections(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY,
    queryFn: fetchCollections,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useObligationsCollectionsCollection(options?: { enabled?: boolean }): ObligationCollection[] {
  const enabled = options?.enabled ?? true;
  const queryResult = useObligationsCollections({ enabled });
  return useSyncedCollection<ObligationCollection>({
    queryData: queryResult.data,
    isSuccess: queryResult.isSuccess,
    collectionName: 'obligation_collections',
    enabled,
  });
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
