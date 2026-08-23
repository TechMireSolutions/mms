/**
 * Phase 7: Contract-driven query/mutation hooks for the Enrollments module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ENROLLMENTS_QUERY_KEY } from '@/tenant/features/enrollments/hooks/useEnrollmentsApi';
import { invalidateEnrollmentsQueries } from '@/tenant/features/enrollments/hooks/invalidateEnrollmentsQueries';

export function useEnrollmentsContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.list.useQuery({
    queryKey: [...ENROLLMENTS_QUERY_KEY, 'contract', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useEnrollmentsContractGet(id: string, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.get.useQuery({
    queryKey: [...ENROLLMENTS_QUERY_KEY, 'detail', id],
    queryData: { params: { id } },
    enabled,
    staleTime: 30_000,
  });
}

export function useEnrollmentsContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.create.useMutation({ onSuccess: () => invalidateEnrollmentsQueries(queryClient) });
}

export function useEnrollmentsContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.update.useMutation({ onSuccess: () => invalidateEnrollmentsQueries(queryClient) });
}

export function useEnrollmentsContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.delete.useMutation({ onSuccess: () => invalidateEnrollmentsQueries(queryClient) });
}

export function useEnrollmentsContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.bulkDelete.useMutation({ onSuccess: () => invalidateEnrollmentsQueries(queryClient) });
}

export function useEnrollmentsContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.enrollments.bulkRestore.useMutation({ onSuccess: () => invalidateEnrollmentsQueries(queryClient) });
}
