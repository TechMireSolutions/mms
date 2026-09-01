/**
 * Phase 7: Contract-driven query/mutation hooks for the Users module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { USERS_LIST_QUERY_KEY } from '@/tenant/features/users/hooks/usersQueryKeys';
import { invalidateUsersQueries } from '@/tenant/features/users/hooks/invalidateUsersQueries';

export function useUsersContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.list.useQuery({
    queryKey: [...USERS_LIST_QUERY_KEY, 'contract', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

export function useUsersContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.create.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.update.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractInvite() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.invite.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractBulkUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.bulkUpdate.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.bulkDelete.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.bulkRestore.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.delete.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.restore.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

export function useUsersContractVerifyEmail() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.users.verifyEmail.useMutation({ onSuccess: () => invalidateUsersQueries(queryClient) });
}

