import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Denomination,
  StockBatch,
  Distribution,
  Redemption,
  HasanatCommandMetricsSnapshot,
  HasanatReportAggregates,
  HasanatReportComparisonQuery,
  HasanatDistributionsListPageResult,
} from '@mms/shared';
import { HASANAT_MODULE_MANIFEST, normalizeHasanatReportComparisonQuery } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiJson } from '@/lib/apiClient';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createModulePaginatedListQuery } from '@/lib/query/createModulePaginatedListQuery';
import {
  buildHasanatPageUrl,
  hasanatPaginatedQueryKey,
  hasanatListQueryKeyParams,
  sameHasanatListFilters,
  type HasanatPaginatedParams,
} from '@/tenant/features/hasanat/hooks/hasanatListQueryBuilders';

export const HASANAT_DENOMS_QUERY_KEY = ['hasanat', 'denoms', 'list'] as const;
export const HASANAT_BATCHES_QUERY_KEY = ['hasanat', 'batches', 'list'] as const;
export const HASANAT_DISTRIBUTIONS_QUERY_KEY = ['hasanat', 'distributions', 'list'] as const;
export const HASANAT_REDEMPTIONS_QUERY_KEY = ['hasanat', 'redemptions', 'list'] as const;
export const HASANAT_METRICS_QUERY_KEY = ['hasanat', 'metrics'] as const;
export const HASANAT_REPORT_AGGREGATES_QUERY_KEY = [
  HASANAT_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;

export const HASANAT_API = HASANAT_MODULE_MANIFEST.restBasePath;

/** @deprecated Prefer NotifiedMutationError — kept for form catch compatibility. */
export class NotifiedHasanatMutationError extends NotifiedMutationError {}

export function useHasanatDenoms(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<Denomination[]>({
    queryKey: HASANAT_DENOMS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ denoms: Denomination[] }>(`${HASANAT_API}/denoms`, { signal });
      return res?.denoms ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatDenomsCollection(options?: { enabled?: boolean }): Denomination[] {
  return useHasanatDenoms(options).data ?? [];
}

export function useHasanatBatches(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<StockBatch[]>({
    queryKey: HASANAT_BATCHES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ batches: StockBatch[] }>(`${HASANAT_API}/batches`, { signal });
      return res?.batches ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatBatchesCollection(options?: { enabled?: boolean }): StockBatch[] {
  return useHasanatBatches(options).data ?? [];
}

export function useHasanatDistributions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  return useQuery<Distribution[]>({
    queryKey: [...HASANAT_DISTRIBUTIONS_QUERY_KEY, { includeDeleted }],
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ distributions: Distribution[] }>(
        `${HASANAT_API}/distributions?includeDeleted=${includeDeleted}`,
        { signal },
      );
      return res?.distributions ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatDistributionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): Distribution[] {
  return useHasanatDistributions(options).data ?? [];
}

/** SQL-paged distributions Work list (server-side search/status/soft-delete). */
export const useHasanatPaginated = createModulePaginatedListQuery<
  HasanatDistributionsListPageResult,
  HasanatPaginatedParams,
  ReturnType<typeof hasanatListQueryKeyParams>
>({
  queryKey: hasanatPaginatedQueryKey,
  keyParams: hasanatListQueryKeyParams,
  sameFilters: sameHasanatListFilters,
  buildUrl: buildHasanatPageUrl,
});

export function useHasanatReportAggregates(
  options?: { enabled?: boolean; comparison?: HasanatReportComparisonQuery },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeHasanatReportComparisonQuery(options?.comparison);
  const queryParams = new URLSearchParams();
  if (comparison?.sessionIds?.length) queryParams.set('sessionIds', comparison.sessionIds.join(','));
  if (comparison?.rangeAFrom) queryParams.set('rangeAFrom', comparison.rangeAFrom);
  if (comparison?.rangeATo) queryParams.set('rangeATo', comparison.rangeATo);
  if (comparison?.rangeBFrom) queryParams.set('rangeBFrom', comparison.rangeBFrom);
  if (comparison?.rangeBTo) queryParams.set('rangeBTo', comparison.rangeBTo);
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [...HASANAT_REPORT_AGGREGATES_QUERY_KEY, comparison ?? null] as const,
    queryFn: async ({ signal }): Promise<HasanatReportAggregates> =>
      apiJson<HasanatReportAggregates>(
        `${HASANAT_API}/report-aggregates${queryString ? `?${queryString}` : ''}`,
        { signal },
      ),
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useHasanatRedemptions(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<Redemption[]>({
    queryKey: HASANAT_REDEMPTIONS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ redemptions: Redemption[] }>(`${HASANAT_API}/redemptions`, { signal });
      return res?.redemptions ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatRedemptionsCollection(options?: { enabled?: boolean }): Redemption[] {
  return useHasanatRedemptions(options).data ?? [];
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
