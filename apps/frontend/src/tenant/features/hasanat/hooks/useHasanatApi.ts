import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Denomination, StockBatch, Distribution, Redemption, HasanatCommandMetricsSnapshot } from '@mms/shared';
import { HASANAT_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';

export const HASANAT_DENOMS_QUERY_KEY = ['hasanat', 'denoms', 'list'] as const;
export const HASANAT_BATCHES_QUERY_KEY = ['hasanat', 'batches', 'list'] as const;
export const HASANAT_DISTRIBUTIONS_QUERY_KEY = ['hasanat', 'distributions', 'list'] as const;
export const HASANAT_REDEMPTIONS_QUERY_KEY = ['hasanat', 'redemptions', 'list'] as const;
export const HASANAT_METRICS_QUERY_KEY = ['hasanat', 'metrics', 'snapshot'] as const;

const HASANAT_API = HASANAT_MODULE_MANIFEST.restBasePath;

export class NotifiedHasanatMutationError extends Error {}

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

export function useHasanatDistributions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<Distribution>({
    queryKey: [...HASANAT_DISTRIBUTIONS_QUERY_KEY, { includeDeleted }],
    apiPath: `${HASANAT_API}/distributions?includeDeleted=${includeDeleted}`,
    responseKey: 'distributions',
    collectionName: 'hasanat_distributions',
    enabled: options?.enabled,
  });
}

export function useHasanatDistributionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): Distribution[] {
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
    moduleId: HASANAT_MODULE_MANIFEST.moduleId,
    apiPath: HASANAT_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

export function useHasanatMutations() {
  const queryClient = useQueryClient();

  const invalidateDistributions = () => {
    void queryClient.invalidateQueries({ queryKey: HASANAT_DISTRIBUTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
  };

  const replaceDenoms = useMutation({
    mutationFn: async (denoms: Denomination[]) =>
      apiJson<{ denoms: Denomination[] }>(`${HASANAT_API}/denoms/bulk`, {
        method: 'PUT',
        body: JSON.stringify(denoms),
      }),
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
      invalidateDistributions();
    },
  });

  const replaceRedemptions = useMutation({
    mutationFn: async (redemptions: Redemption[]) =>
      apiJson<{ redemptions: Redemption[] }>(`${HASANAT_API}/redemptions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(redemptions),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HASANAT_REDEMPTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  const deleteDistribution = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${HASANAT_API}/distributions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidateDistributions(),
  });

  const restoreDistribution = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(
        `${HASANAT_API}/distributions/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => invalidateDistributions(),
  });

  const bulkDeleteDistributions = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${HASANAT_API}/distributions/bulk-delete`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateDistributions(),
  });

  const bulkRestoreDistributions = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${HASANAT_API}/distributions/bulk-restore`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateDistributions(),
  });

  return {
    replaceDenoms,
    replaceBatches,
    replaceDistributions,
    replaceRedemptions,
    deleteDistribution,
    restoreDistribution,
    bulkDeleteDistributions,
    bulkRestoreDistributions,
  };
}
