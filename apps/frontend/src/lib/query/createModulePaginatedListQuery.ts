import { useQuery, type UseQueryResult, type UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

export interface CreateModulePaginatedListOptions<R, P extends { enabled?: boolean }, K> {
  /** Builds the stable query key for the page/filter tuple. */
  queryKey: (params: P) => readonly unknown[];
  /** Normalized filter object — the key params appended to the query key. */
  keyParams: (params: P) => K;
  /** True when previous page data may be reused for the next page (avoid stale flash). */
  sameFilters: (previous: K | undefined, next: K) => boolean;
  /** Builds the server SQL-page URL from the same params. */
  buildUrl: (params: P) => string;
  staleTime?: number;
}

/**
 * Pure query-options builder for a SQL-paginated module list (server page +
 * prev-page placeholder). Split from the hook so the placeholder policy, enabled
 * rule and staleness are unit-testable without a renderer.
 */
export function createModulePaginatedListOptions<R, P extends { enabled?: boolean }, K>(
  options: CreateModulePaginatedListOptions<R, P, K>,
  params: P,
  isAuthenticated: boolean,
): UseQueryOptions<R> {
  const enabled = params.enabled ?? true;
  const currentKeyParams = options.keyParams(params);
  return {
    queryKey: options.queryKey(params),
    queryFn: async ({ signal }) => apiJson<R>(options.buildUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: options.staleTime ?? 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey.at(-1) as K | undefined;
      return options.sameFilters(previousParams, currentKeyParams) ? previousData : undefined;
    },
  };
}

/**
 * Shared SQL-paginated list query hook (server page + prev-page placeholder).
 *
 * Contacts and Students Work lists were hand-rolled `useQuery` + `placeholderData`
 * blocks with identical shape; both now wrap this factory so the enabled rule,
 * staleness and placeholder policy live in one place.
 */
export function createModulePaginatedListQuery<R, P extends { enabled?: boolean }, K>(
  options: CreateModulePaginatedListOptions<R, P, K>,
) {
  return function useModulePaginatedList(params: P): UseQueryResult<R> {
    const { isAuthenticated } = useAuth();
    return useQuery(createModulePaginatedListOptions(options, params, isAuthenticated));
  };
}
