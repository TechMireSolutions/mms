import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Denomination, StockBatch, Distribution, Redemption, HasanatCommandMetricsSnapshot } from '@mms/shared';
import { HASANAT_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const HASANAT_DENOMS_QUERY_KEY = ['hasanat', 'denoms', 'list'] as const;
export const HASANAT_BATCHES_QUERY_KEY = ['hasanat', 'batches', 'list'] as const;
export const HASANAT_DISTRIBUTIONS_QUERY_KEY = ['hasanat', 'distributions', 'list'] as const;
export const HASANAT_REDEMPTIONS_QUERY_KEY = ['hasanat', 'redemptions', 'list'] as const;
export const HASANAT_METRICS_QUERY_KEY = ['hasanat', 'metrics', 'snapshot'] as const;

const HASANAT_API = HASANAT_MODULE_CONTRACT.restBasePath;

export function useHasanatDenoms(options?: { enabled?: boolean }) {
  return useCollectionSync<Denomination>({
    queryKey: HASANAT_DENOMS_QUERY_KEY,
    apiPath: `${HASANAT_API}/denoms`,
    responseKey: 'denoms',
    collectionName: 'hasanat_denoms',
    enabled: options?.enabled,
  });
}

export function useHasanatDenomsCollection(options?: { enabled?: boolean }): Denomination[] {
  return useHasanatDenoms(options).syncedData;
}

export function useHasanatBatches(options?: { enabled?: boolean }) {
  return useCollectionSync<StockBatch>({
    queryKey: HASANAT_BATCHES_QUERY_KEY,
    apiPath: `${HASANAT_API}/batches`,
    responseKey: 'batches',
    collectionName: 'hasanat_batches',
    enabled: options?.enabled,
  });
}

export function useHasanatBatchesCollection(options?: { enabled?: boolean }): StockBatch[] {
  return useHasanatBatches(options).syncedData;
}

export function useHasanatDistributions(options?: { enabled?: boolean }) {
  return useCollectionSync<Distribution>({
    queryKey: HASANAT_DISTRIBUTIONS_QUERY_KEY,
    apiPath: `${HASANAT_API}/distributions`,
    responseKey: 'distributions',
    collectionName: 'hasanat_distributions',
    enabled: options?.enabled,
  });
}

export function useHasanatDistributionsCollection(options?: { enabled?: boolean }): Distribution[] {
  return useHasanatDistributions(options).syncedData;
}

export function useHasanatRedemptions(options?: { enabled?: boolean }) {
  return useCollectionSync<Redemption>({
    queryKey: HASANAT_REDEMPTIONS_QUERY_KEY,
    apiPath: `${HASANAT_API}/redemptions`,
    responseKey: 'redemptions',
    collectionName: 'hasanat_redemptions',
    enabled: options?.enabled,
  });
}

export function useHasanatRedemptionsCollection(options?: { enabled?: boolean }): Redemption[] {
  return useHasanatRedemptions(options).syncedData;
}

export function useHasanatMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<HasanatCommandMetricsSnapshot>({
    moduleId: HASANAT_MODULE_CONTRACT.moduleId,
    apiPath: HASANAT_MODULE_CONTRACT.restBasePath,
    enabled: options?.enabled,
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
