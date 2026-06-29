import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Denomination, StockBatch, Distribution, Redemption, ModuleColumnPref, HasanatCommandMetricsSnapshot } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

export const HASANAT_DENOMS_QUERY_KEY = ['hasanat', 'denoms', 'list'] as const;
export const HASANAT_BATCHES_QUERY_KEY = ['hasanat', 'batches', 'list'] as const;
export const HASANAT_DISTRIBUTIONS_QUERY_KEY = ['hasanat', 'distributions', 'list'] as const;
export const HASANAT_REDEMPTIONS_QUERY_KEY = ['hasanat', 'redemptions', 'list'] as const;
export const HASANAT_METRICS_QUERY_KEY = ['hasanat', 'metrics', 'snapshot'] as const;

export const HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY = [
  HASANAT_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

export const HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY = [
  HASANAT_MODULE_CONTRACT.redemptionCollectionKey,
  'column-preferences',
] as const;

const HASANAT_API = HASANAT_MODULE_CONTRACT.restBasePath;

async function fetchDenoms(): Promise<Denomination[]> {
  const body = await apiJson<{ denoms: Denomination[] }>(`${HASANAT_API}/denoms`);
  saveCollection('hasanat_denoms', body.denoms);
  return getCollection<Denomination>('hasanat_denoms', []);
}

async function fetchBatches(): Promise<StockBatch[]> {
  const body = await apiJson<{ batches: StockBatch[] }>(`${HASANAT_API}/batches`);
  saveCollection('hasanat_batches', body.batches);
  return getCollection<StockBatch>('hasanat_batches', []);
}

async function fetchDistributions(): Promise<Distribution[]> {
  const body = await apiJson<{ distributions: Distribution[] }>(`${HASANAT_API}/distributions`);
  saveCollection('hasanat_distributions', body.distributions);
  return getCollection<Distribution>('hasanat_distributions', []);
}

async function fetchRedemptions(): Promise<Redemption[]> {
  const body = await apiJson<{ redemptions: Redemption[] }>(`${HASANAT_API}/redemptions`);
  saveCollection('hasanat_redemptions', body.redemptions);
  return getCollection<Redemption>('hasanat_redemptions', []);
}

export function useHasanatDenoms(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_DENOMS_QUERY_KEY,
    queryFn: fetchDenoms,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useHasanatDenomsCollection(options?: { enabled?: boolean }): Denomination[] {
  const enabled = options?.enabled ?? true;
  const { data: queryDenominations = [] } = useHasanatDenoms({ enabled });
  const localDenominations = useLiveCollection<Denomination>('hasanat_denoms', [], { enabled });
  if (!enabled) return [];
  if (queryDenominations.length > 0) {
    return queryDenominations;
  }
  return localDenominations;
}

export function useHasanatBatches(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_BATCHES_QUERY_KEY,
    queryFn: fetchBatches,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useHasanatBatchesCollection(options?: { enabled?: boolean }): StockBatch[] {
  const enabled = options?.enabled ?? true;
  const { data: queryBatches = [] } = useHasanatBatches({ enabled });
  const localBatches = useLiveCollection<StockBatch>('hasanat_batches', [], { enabled });
  if (!enabled) return [];
  if (queryBatches.length > 0) {
    return queryBatches;
  }
  return localBatches;
}

export function useHasanatDistributions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_DISTRIBUTIONS_QUERY_KEY,
    queryFn: fetchDistributions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useHasanatDistributionsCollection(options?: { enabled?: boolean }): Distribution[] {
  const enabled = options?.enabled ?? true;
  const { data: queryDistributions = [] } = useHasanatDistributions({ enabled });
  const localDistributions = useLiveCollection<Distribution>('hasanat_distributions', [], { enabled });
  if (!enabled) return [];
  if (queryDistributions.length > 0) {
    return queryDistributions;
  }
  return localDistributions;
}

export function useHasanatRedemptions(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_REDEMPTIONS_QUERY_KEY,
    queryFn: fetchRedemptions,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useHasanatRedemptionsCollection(options?: { enabled?: boolean }): Redemption[] {
  const enabled = options?.enabled ?? true;
  const { data: queryRedemptions = [] } = useHasanatRedemptions({ enabled });
  const localRedemptions = useLiveCollection<Redemption>('hasanat_redemptions', [], { enabled });
  if (!enabled) return [];
  if (queryRedemptions.length > 0) {
    return queryRedemptions;
  }
  return localRedemptions;
}

export function useHasanatMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: HasanatCommandMetricsSnapshot }>(`${HASANAT_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useHasanatMutations() {
  const queryClient = useQueryClient();

  const replaceDenoms = useMutation({
    mutationFn: async (denoms: Denomination[]) =>
      apiJson<{ denoms: Denomination[] }>(`${HASANAT_API}/denoms/bulk`, {
        method: 'PUT',
        body: JSON.stringify(denoms),
      }),
    onSuccess: (response) => {
      saveCollection('hasanat_denoms', response.denoms);
      void queryClient.invalidateQueries({ queryKey: HASANAT_DENOMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  const replaceBatches = useMutation({
    mutationFn: async (batches: StockBatch[]) =>
      apiJson<{ batches: StockBatch[] }>(`${HASANAT_API}/batches/bulk`, {
        method: 'PUT',
        body: JSON.stringify(batches),
      }),
    onSuccess: (response) => {
      saveCollection('hasanat_batches', response.batches);
      void queryClient.invalidateQueries({ queryKey: HASANAT_BATCHES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  const replaceDistributions = useMutation({
    mutationFn: async (distributions: Distribution[]) =>
      apiJson<{ distributions: Distribution[] }>(`${HASANAT_API}/distributions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(distributions),
      }),
    onSuccess: (response) => {
      saveCollection('hasanat_distributions', response.distributions);
      void queryClient.invalidateQueries({ queryKey: HASANAT_DISTRIBUTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  const replaceRedemptions = useMutation({
    mutationFn: async (redemptions: Redemption[]) =>
      apiJson<{ redemptions: Redemption[] }>(`${HASANAT_API}/redemptions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(redemptions),
      }),
    onSuccess: (response) => {
      saveCollection('hasanat_redemptions', response.redemptions);
      void queryClient.invalidateQueries({ queryKey: HASANAT_REDEMPTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  return {
    replaceDenoms,
    replaceBatches,
    replaceDistributions,
    replaceRedemptions,
  };
}

export function useHasanatDistributionColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(`${HASANAT_API}/distributions/column-preferences`);
      return readModuleColumnPreferences(body);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useHasanatDistributionColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${HASANAT_API}/distributions/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(HASANAT_DISTRIBUTION_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(response));
    },
  });
}

export function useHasanatRedemptionColumnPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(`${HASANAT_API}/redemptions/column-preferences`);
      return readModuleColumnPreferences(body);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useHasanatRedemptionColumnPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${HASANAT_API}/redemptions/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(HASANAT_REDEMPTION_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(response));
    },
  });
}
