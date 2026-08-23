/**
 * Phase 7: Contract-driven query/mutation hooks for the Sessions module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { SESSIONS_QUERY_KEY } from '@/tenant/features/sessions/hooks/useSessions';
import { invalidateSessionsQueries } from '@/tenant/features/sessions/hooks/invalidateSessionsQueries';

export function useSessionsContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.list.useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, 'contract', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useSessionsContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.create.useMutation({ onSuccess: () => invalidateSessionsQueries(queryClient) });
}

export function useSessionsContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.bulkDelete.useMutation({ onSuccess: () => invalidateSessionsQueries(queryClient) });
}

export function useSessionsContractBulkStatus() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.bulkStatus.useMutation({ onSuccess: () => invalidateSessionsQueries(queryClient) });
}

export function useSessionsContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.sessions.bulkRestore.useMutation({ onSuccess: () => invalidateSessionsQueries(queryClient) });
}
