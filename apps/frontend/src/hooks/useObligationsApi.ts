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

export const OBLIGATIONS_TYPES_QUERY_KEY = ['obligations', 'types', 'list'] as const;
export const OBLIGATIONS_MUJTAHIDS_QUERY_KEY = ['obligations', 'mujtahids', 'list'] as const;
export const OBLIGATIONS_REPS_QUERY_KEY = ['obligations', 'reps', 'list'] as const;
export const OBLIGATIONS_WAKALA_QUERY_KEY = ['obligations', 'wakala', 'list'] as const;
export const OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY = ['obligations', 'distributions', 'list'] as const;
export const OBLIGATIONS_COLLECTIONS_QUERY_KEY = ['obligations', 'collections', 'list'] as const;
export const OBLIGATIONS_METRICS_QUERY_KEY = ['obligations', 'metrics', 'snapshot'] as const;

export const OBLIGATIONS_COLUMN_PREFS_QUERY_KEY = [
  OBLIGATIONS_MODULE_CONTRACT.collectionKey,
  'column-prefs',
] as const;

const OBLIGATIONS_API = OBLIGATIONS_MODULE_CONTRACT.restBasePath;

async function fetchTypes(): Promise<ObligationType[]> {
  const body = await apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types`);
  saveCollection('obligation_types', body.types);
  return getCollection<ObligationType>('obligation_types', []);
}

async function fetchMujtahids(): Promise<Mujtahid[]> {
  const body = await apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids`);
  saveCollection('mujtahids', body.mujtahids);
  return getCollection<Mujtahid>('mujtahids', []);
}

async function fetchReps(): Promise<MujtahidRep[]> {
  const body = await apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps`);
  saveCollection('mujtahid_reps', body.reps);
  return getCollection<MujtahidRep>('mujtahid_reps', []);
}

async function fetchWakala(): Promise<WakalaType[]> {
  const body = await apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala`);
  saveCollection('wakala_types', body.wakalaTypes);
  return getCollection<WakalaType>('wakala_types', []);
}

async function fetchDistributions(): Promise<ObligationDistribution[]> {
  const body = await apiJson<{ distributions: ObligationDistribution[] }>(`${OBLIGATIONS_API}/distributions`);
  saveCollection('obligation_distributions', body.distributions);
  return getCollection<ObligationDistribution>('obligation_distributions', []);
}

async function fetchCollections(): Promise<ObligationCollection[]> {
  const body = await apiJson<{ collections: ObligationCollection[] }>(`${OBLIGATIONS_API}/collections`);
  saveCollection('obligation_collections', body.collections);
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
  const { data: fromQuery = [] } = useObligationsTypes({ enabled });
  const fromLocal = useLiveCollection<ObligationType>('obligation_types', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
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
  const { data: fromQuery = [] } = useObligationsMujtahids({ enabled });
  const fromLocal = useLiveCollection<Mujtahid>('mujtahids', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
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
  const { data: fromQuery = [] } = useObligationsReps({ enabled });
  const fromLocal = useLiveCollection<MujtahidRep>('mujtahid_reps', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
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
  const { data: fromQuery = [] } = useObligationsWakala({ enabled });
  const fromLocal = useLiveCollection<WakalaType>('wakala_types', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
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
  const { data: fromQuery = [] } = useObligationsDistributions({ enabled });
  const fromLocal = useLiveCollection<ObligationDistribution>('obligation_distributions', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
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
  const { data: fromQuery = [] } = useObligationsCollections({ enabled });
  const fromLocal = useLiveCollection<ObligationCollection>('obligation_collections', [], { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) return fromQuery;
  return fromLocal;
}

export function useObligationsMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: OBLIGATIONS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: ObligationsCommandMetricsSnapshot }>(`${OBLIGATIONS_API}/metrics`);
      return body.metrics;
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
    onSuccess: (data) => {
      saveCollection('obligation_types', data.types);
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
    onSuccess: (data) => {
      saveCollection('mujtahids', data.mujtahids);
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
    onSuccess: (data) => {
      saveCollection('mujtahid_reps', data.reps);
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
    onSuccess: (data) => {
      saveCollection('wakala_types', data.wakalaTypes);
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
    onSuccess: (data) => {
      saveCollection('obligation_distributions', data.distributions);
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
    onSuccess: (data) => {
      saveCollection('obligation_collections', data.collections);
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
      const body = await apiJson<{ prefs: ModuleColumnPref[] }>(`${OBLIGATIONS_API}/column-preferences`);
      return body.prefs;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useObligationColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: ModuleColumnPref[]) =>
      apiJson<{ success: boolean; prefs: ModuleColumnPref[] }>(`${OBLIGATIONS_API}/column-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ prefs }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(OBLIGATIONS_COLUMN_PREFS_QUERY_KEY, data.prefs);
    },
  });
}
