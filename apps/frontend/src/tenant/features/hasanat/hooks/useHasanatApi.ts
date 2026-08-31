import { useQueryClient } from '@tanstack/react-query';
import type { MutateOptions } from '@tanstack/react-query';
import type {
  Denomination,
  StockBatch,
  Distribution,
  Redemption,
  HasanatCommandMetricsSnapshot,
  HasanatReportComparisonQuery,
} from '@mms/shared';
import { HASANAT_MODULE_MANIFEST, normalizeHasanatReportComparisonQuery } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient } from '@/lib/api';




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



export function useHasanatDenoms(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listDenoms.useQuery({
    queryKey: HASANAT_DENOMS_QUERY_KEY,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatDenomsCollection(options?: { enabled?: boolean }): Denomination[] {
  const query = useHasanatDenoms(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as Denomination[];
  if (body && typeof body === 'object' && 'denoms' in body && Array.isArray(body.denoms)) {
    return body.denoms as Denomination[];
  }
  return [];
}

export function useHasanatBatches(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listBatches.useQuery({
    queryKey: HASANAT_BATCHES_QUERY_KEY,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatBatchesCollection(options?: { enabled?: boolean }): StockBatch[] {
  const query = useHasanatBatches(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as StockBatch[];
  if (body && typeof body === 'object' && 'batches' in body && Array.isArray(body.batches)) {
    return body.batches as StockBatch[];
  }
  return [];
}

export function useHasanatDistributions(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listDistributions.useQuery({
    queryKey: [...HASANAT_DISTRIBUTIONS_QUERY_KEY, { includeDeleted }],
    queryData: { query: { includeDeleted: includeDeleted ? 'true' : 'false' } },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatDistributionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): Distribution[] {
  const query = useHasanatDistributions(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body;
  if (Array.isArray(body)) return body as Distribution[];
  if (body && typeof body === 'object' && 'distributions' in body && Array.isArray(body.distributions)) {
    return body.distributions as Distribution[];
  }
  return [];
}



export function useHasanatReportAggregates(
  options?: { enabled?: boolean; comparison?: HasanatReportComparisonQuery },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeHasanatReportComparisonQuery(options?.comparison);
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.reportAggregates.useQuery({
    queryKey: [...HASANAT_REPORT_AGGREGATES_QUERY_KEY, comparison ?? null],
    queryData: {
      query: {
        sessionIds: comparison?.sessionIds?.length ? comparison.sessionIds.join(',') : undefined,
        rangeAFrom: comparison?.rangeAFrom,
        rangeATo: comparison?.rangeATo,
        rangeBFrom: comparison?.rangeBFrom,
        rangeBTo: comparison?.rangeBTo,
      },
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useHasanatRedemptions(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listRedemptions.useQuery({
    queryKey: HASANAT_REDEMPTIONS_QUERY_KEY,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useHasanatRedemptionsCollection(options?: { enabled?: boolean }): Redemption[] {
  const query = useHasanatRedemptions(options);
  if (!query.data || query.data.status !== 200) return [];
  const body: unknown = query.data.body;
  if (Array.isArray(body)) return body as Redemption[];
  return (body as { redemptions?: Redemption[] } | null)?.redemptions ?? [];
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

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceDenoms = tsrClient.hasanat.replaceDenoms.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HASANAT_DENOMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceBatches = tsrClient.hasanat.replaceBatches.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HASANAT_BATCHES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceDistributions = tsrClient.hasanat.replaceDistributions.useMutation({
    onSuccess: () => {
      invalidateDistributions();
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const replaceRedemptions = tsrClient.hasanat.replaceRedemptions.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HASANAT_REDEMPTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HASANAT_METRICS_QUERY_KEY });
    },
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const deleteDistribution = tsrClient.hasanat.deleteDistribution.useMutation({
    onSuccess: () => invalidateDistributions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const restoreDistribution = tsrClient.hasanat.restoreDistribution.useMutation({
    onSuccess: () => invalidateDistributions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkDeleteDistributions = tsrClient.hasanat.bulkDeleteDistributions.useMutation({
    onSuccess: () => invalidateDistributions(),
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkRestoreDistributions = tsrClient.hasanat.bulkRestoreDistributions.useMutation({
    onSuccess: () => invalidateDistributions(),
  });

  return {
    replaceDenoms: {
      ...replaceDenoms,
      mutate: (denoms: Denomination[], opts?: MutateOptions) => replaceDenoms.mutate({ body: denoms }, opts),
      mutateAsync: (denoms: Denomination[]) => replaceDenoms.mutateAsync({ body: denoms }),
    },
    replaceBatches: {
      ...replaceBatches,
      mutate: (batches: StockBatch[], opts?: MutateOptions) => replaceBatches.mutate({ body: batches }, opts),
      mutateAsync: (batches: StockBatch[]) => replaceBatches.mutateAsync({ body: batches }),
    },
    replaceDistributions: {
      ...replaceDistributions,
      mutate: (distributions: Distribution[], opts?: MutateOptions) => replaceDistributions.mutate({ body: distributions }, opts),
      mutateAsync: (distributions: Distribution[]) => replaceDistributions.mutateAsync({ body: distributions }),
    },
    replaceRedemptions: {
      ...replaceRedemptions,
      mutate: (redemptions: Redemption[], opts?: MutateOptions) => replaceRedemptions.mutate({ body: redemptions }, opts),
      mutateAsync: (redemptions: Redemption[]) => replaceRedemptions.mutateAsync({ body: redemptions }),
    },
    deleteDistribution: {
      ...deleteDistribution,
      mutate: (id: string, opts?: MutateOptions) => deleteDistribution.mutate({ params: { id }, body: {} }, opts),
      mutateAsync: (id: string) => deleteDistribution.mutateAsync({ params: { id }, body: {} }),
    },
    restoreDistribution: {
      ...restoreDistribution,
      mutate: (id: string, opts?: MutateOptions) => restoreDistribution.mutate({ params: { id }, body: {} }, opts),
      mutateAsync: (id: string) => restoreDistribution.mutateAsync({ params: { id }, body: {} }),
    },
    bulkDeleteDistributions: {
      ...bulkDeleteDistributions,
      mutate: (ids: string[], opts?: MutateOptions) => bulkDeleteDistributions.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkDeleteDistributions.mutateAsync({ body: { ids } }),
    },
    bulkRestoreDistributions: {
      ...bulkRestoreDistributions,
      mutate: (ids: string[], opts?: MutateOptions) => bulkRestoreDistributions.mutate({ body: { ids } }, opts),
      mutateAsync: (ids: string[]) => bulkRestoreDistributions.mutateAsync({ body: { ids } }),
    },
  };
}
