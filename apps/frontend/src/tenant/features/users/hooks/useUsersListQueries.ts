import { USERS_MODULE_MANIFEST } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tsrClient, apiContract } from '@/lib/api';
import {
  sameUsersListFilters,
  usersListQueryKeyParams,
  usersPaginatedQueryKey,
  type UsersListPageResult,
  type UsersPaginatedParams,
} from '@/tenant/features/users/hooks/usersQueryKeys';

export function useUsersPaginated(params: UsersPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.users.list.useQuery({
    queryKey: usersPaginatedQueryKey(params),
    queryData: { query: usersListQueryKeyParams(params) as any },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData: any, previousQuery: any) => {
      const previousParams = previousQuery?.queryKey[3] as
        | ReturnType<typeof usersListQueryKeyParams>
        | undefined;
      const keyParams = usersListQueryKeyParams(params);
      return sameUsersListFilters(previousParams, keyParams) ? previousData : undefined;
    },
  });
  
  return { ...query, data: query.data?.body as UsersListPageResult | undefined };
}

/** Fetches all pages matching Work filters (non-Work consumers / export). */
export async function fetchAllUsersForQuery(
  params: Omit<UsersPaginatedParams, 'page' | 'enabled'> = {},
  onProgress?: (fetched: number, total: number) => void,
): Promise<UsersListPageResult['users']> {
  const limit = USERS_MODULE_MANIFEST.maxPageSize;
  const all: UsersListPageResult['users'] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const response = await apiContract.users.list({
      query: { ...(params as any), page, limit }
    });
    const usersPage = response.body as UsersListPageResult;
    all.push(...usersPage.users);
    total = usersPage.total;
    onProgress?.(all.length, total);
    if (!usersPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export type { UsersPaginatedParams };
