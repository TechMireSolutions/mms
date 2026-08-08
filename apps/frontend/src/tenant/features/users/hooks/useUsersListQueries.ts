import { useQuery } from '@tanstack/react-query';
import { USERS_MODULE_MANIFEST } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import {
  buildUsersPageUrl,
  sameUsersListFilters,
  usersListQueryKeyParams,
  usersPaginatedQueryKey,
  type UsersListPageResult,
  type UsersPaginatedParams,
} from '@/tenant/features/users/hooks/usersQueryKeys';

export function useUsersPaginated(params: UsersPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: usersPaginatedQueryKey(params),
    queryFn: async ({ signal }) =>
      apiJson<UsersListPageResult>(buildUsersPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[3] as
        | ReturnType<typeof usersListQueryKeyParams>
        | undefined;
      const keyParams = usersListQueryKeyParams(params);
      return sameUsersListFilters(previousParams, keyParams) ? previousData : undefined;
    },
  });
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
    const usersPage = await apiJson<UsersListPageResult>(
      buildUsersPageUrl({ ...params, page, limit }),
    );
    all.push(...usersPage.users);
    total = usersPage.total;
    onProgress?.(all.length, total);
    if (!usersPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export type { UsersPaginatedParams };
