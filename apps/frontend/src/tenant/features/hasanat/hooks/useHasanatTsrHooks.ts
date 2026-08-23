/**
 * Phase 7: Contract-driven query/mutation hooks for the Hasanat module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  HASANAT_DISTRIBUTIONS_QUERY_KEY,
  HASANAT_DENOMS_QUERY_KEY,
  HASANAT_BATCHES_QUERY_KEY,
  HASANAT_REDEMPTIONS_QUERY_KEY,
} from '@/tenant/features/hasanat/hooks/useHasanatApi';
import { invalidateHasanatQueries } from '@/tenant/features/hasanat/hooks/invalidateHasanatQueries';

export function useHasanatContractList(query: Record<string, unknown> = {}, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listDistributions.useQuery({
    queryKey: [HASANAT_DISTRIBUTIONS_QUERY_KEY, 'contract-list', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useHasanatContractDenoms(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listDenoms.useQuery({
    queryKey: [HASANAT_DENOMS_QUERY_KEY, 'contract-list'],
    queryData: { query: {} },
    staleTime: 30_000,
    enabled,
  });
}

export function useHasanatContractBatches(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listBatches.useQuery({
    queryKey: [HASANAT_BATCHES_QUERY_KEY, 'contract-list'],
    queryData: { query: {} },
    staleTime: 30_000,
    enabled,
  });
}

export function useHasanatContractRedemptions(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.listRedemptions.useQuery({
    queryKey: [HASANAT_REDEMPTIONS_QUERY_KEY, 'contract-list'],
    queryData: { query: {} },
    staleTime: 30_000,
    enabled,
  });
}

export function useHasanatContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.bulkDeleteDistributions.useMutation({
    onSuccess: () => invalidateHasanatQueries(queryClient),
  });
}

export function useHasanatContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.bulkRestoreDistributions.useMutation({
    onSuccess: () => invalidateHasanatQueries(queryClient),
  });
}

export function useHasanatContractDeleteDistribution() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.deleteDistribution.useMutation({
    onSuccess: () => invalidateHasanatQueries(queryClient),
  });
}

export function useHasanatContractRestoreDistribution() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.hasanat.restoreDistribution.useMutation({
    onSuccess: () => invalidateHasanatQueries(queryClient),
  });
}
