import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
  ModuleColumnPref,
  ObligationsCommandMetricsSnapshot,
} from '@mms/shared';
import { OBLIGATIONS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

export const OBLIGATIONS_TYPES_QUERY_KEY = ['obligations', 'types', 'list'] as const;
export const OBLIGATIONS_MUJTAHIDS_QUERY_KEY = ['obligations', 'mujtahids', 'list'] as const;
export const OBLIGATIONS_REPS_QUERY_KEY = ['obligations', 'reps', 'list'] as const;
export const OBLIGATIONS_WAKALA_QUERY_KEY = ['obligations', 'wakala', 'list'] as const;
export const OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY = ['obligations', 'distributions', 'list'] as const;
export const OBLIGATIONS_COLLECTIONS_QUERY_KEY = ['obligations', 'collections', 'list'] as const;
export const OBLIGATIONS_METRICS_QUERY_KEY = ['obligations', 'metrics', 'snapshot'] as const;

export const OBLIGATIONS_COLUMN_PREFS_QUERY_KEY = [
  OBLIGATIONS_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const OBLIGATIONS_API = OBLIGATIONS_MODULE_CONTRACT.restBasePath;

async function fetchTypes(): Promise<ObligationType[]> {
  const typesResponse = await apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types`);
  saveCollection('obligation_types', typesResponse.types);
  return getCollection<ObligationType>('obligation_types', []);
}

async function fetchMujtahids(): Promise<Mujtahid[]> {
  const mujtahidsResponse = await apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids`);
  saveCollection('mujtahids', mujtahidsResponse.mujtahids);
  return getCollection<Mujtahid>('mujtahids', []);
}

async function fetchReps(): Promise<MujtahidRep[]> {
  const repsResponse = await apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps`);
  saveCollection('mujtahid_reps', repsResponse.reps);
  return getCollection<MujtahidRep>('mujtahid_reps', []);
}

async function fetchWakala(): Promise<WakalaType[]> {
  const wakalaResponse = await apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala`);
  saveCollection('wakala_types', wakalaResponse.wakalaTypes);
  return getCollection<WakalaType>('wakala_types', []);
}

async function fetchDistributions(): Promise<ObligationDistribution[]> {
  const distributionsResponse = await apiJson<{ distributions: ObligationDistribution[] }>(`${OBLIGATIONS_API}/distributions`);
  saveCollection('obligation_distributions', distributionsResponse.distributions);
  return getCollection<ObligationDistribution>('obligation_distributions', []);
}

async function fetchCollections(): Promise<ObligationCollection[]> {
  const collectionsResponse = await apiJson<{ collections: ObligationCollection[] }>(`${OBLIGATIONS_API}/collections`);
  saveCollection('obligation_collections', collectionsResponse.collections);
  return getCollection<ObligationCollection>('obligation_collections', []);
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
  const { data: queryTypes = [] } = useObligationsTypes({ enabled });
  const localTypes = useLiveCollection<ObligationType>('obligation_types', [], { enabled });
  if (!enabled) return [];
  if (queryTypes.length > 0) return queryTypes;
  return localTypes;
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
  const { data: queryMujtahids = [] } = useObligationsMujtahids({ enabled });
  const localMujtahids = useLiveCollection<Mujtahid>('mujtahids', [], { enabled });
  if (!enabled) return [];
  if (queryMujtahids.length > 0) return queryMujtahids;
  return localMujtahids;
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
  const { data: queryReps = [] } = useObligationsReps({ enabled });
  const localReps = useLiveCollection<MujtahidRep>('mujtahid_reps', [], { enabled });
  if (!enabled) return [];
  if (queryReps.length > 0) return queryReps;
  return localReps;
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
  const { data: queryWakalaTypes = [] } = useObligationsWakala({ enabled });
  const localWakalaTypes = useLiveCollection<WakalaType>('wakala_types', [], { enabled });
  if (!enabled) return [];
  if (queryWakalaTypes.length > 0) return queryWakalaTypes;
  return localWakalaTypes;
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
  const { data: queryDistributions = [] } = useObligationsDistributions({ enabled });
  const localDistributions = useLiveCollection<ObligationDistribution>('obligation_distributions', [], { enabled });
  if (!enabled) return [];
  if (queryDistributions.length > 0) return queryDistributions;
  return localDistributions;
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
  const { data: queryCollections = [] } = useObligationsCollections({ enabled });
  const localCollections = useLiveCollection<ObligationCollection>('obligation_collections', [], { enabled });
  if (!enabled) return [];
  if (queryCollections.length > 0) return queryCollections;
  return localCollections;
}

export function useObligationsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: ObligationsCommandMetricsSnapshot }>(`${OBLIGATIONS_API}/metrics`);
      return metricsResponse.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
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

export function useObligationColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(`${OBLIGATIONS_API}/column-preferences`);
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useObligationColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${OBLIGATIONS_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(OBLIGATIONS_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
  });
}
