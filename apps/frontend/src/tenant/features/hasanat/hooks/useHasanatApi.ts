import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Denomination, StockBatch, Distribution, Redemption, HasanatCommandMetricsSnapshot } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';

export const HASANAT_DENOMS_QUERY_KEY = ['hasanat', 'denoms', 'list'] as const;
export const HASANAT_BATCHES_QUERY_KEY = ['hasanat', 'batches', 'list'] as const;
export const HASANAT_DISTRIBUTIONS_QUERY_KEY = ['hasanat', 'distributions', 'list'] as const;
export const HASANAT_REDEMPTIONS_QUERY_KEY = ['hasanat', 'redemptions', 'list'] as const;
export const HASANAT_METRICS_QUERY_KEY = ['hasanat', 'metrics', 'snapshot'] as const;

const HASANAT_API = HASANAT_MODULE_CONTRACT.restBasePath;

async function fetchDenoms(): Promise<Denomination[]> {
  const denomsResponse = await apiJson<{ denoms: Denomination[] }>(`${HASANAT_API}/denoms`);
  saveCollection('hasanat_denoms', denomsResponse.denoms);
  return denomsResponse.denoms;
}

async function fetchBatches(): Promise<StockBatch[]> {
  const batchesResponse = await apiJson<{ batches: StockBatch[] }>(`${HASANAT_API}/batches`);
  saveCollection('hasanat_batches', batchesResponse.batches);
  return batchesResponse.batches;
}

async function fetchDistributions(): Promise<Distribution[]> {
  const distributionsResponse = await apiJson<{ distributions: Distribution[] }>(`${HASANAT_API}/distributions`);
  saveCollection('hasanat_distributions', distributionsResponse.distributions);
  return distributionsResponse.distributions;
}

async function fetchRedemptions(): Promise<Redemption[]> {
  const redemptionsResponse = await apiJson<{ redemptions: Redemption[] }>(`${HASANAT_API}/redemptions`);
  saveCollection('hasanat_redemptions', redemptionsResponse.redemptions);
  return redemptionsResponse.redemptions;
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
  const { data: queryDenominations, isSuccess } = useHasanatDenoms({ enabled });
  const localDenominations = useLiveCollection<Denomination>('hasanat_denoms', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryDenominations) {
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
  const { data: queryBatches, isSuccess } = useHasanatBatches({ enabled });
  const localBatches = useLiveCollection<StockBatch>('hasanat_batches', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryBatches) {
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
  const { data: queryDistributions, isSuccess } = useHasanatDistributions({ enabled });
  const localDistributions = useLiveCollection<Distribution>('hasanat_distributions', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryDistributions) {
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
  const { data: queryRedemptions, isSuccess } = useHasanatRedemptions({ enabled });
  const localRedemptions = useLiveCollection<Redemption>('hasanat_redemptions', [], { enabled });
  if (!enabled) return [];
  if (isSuccess && queryRedemptions) {
    return queryRedemptions;
  }
  return localRedemptions;
}

export function useHasanatMetrics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: HASANAT_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: HasanatCommandMetricsSnapshot }>(`${HASANAT_API}/metrics`);
      return metricsResponse.metrics;
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
