import {
  HASANAT_MODULE_MANIFEST,
  type Distribution,
  type HasanatDistributionsListPageResult,
  type HasanatListQuery,
} from '@mms/shared';
import {
  HASANAT_API,
  HASANAT_DISTRIBUTIONS_QUERY_KEY,
} from '@/tenant/features/hasanat/hooks/useHasanatApi';

export type { Distribution, HasanatDistributionsListPageResult };

/** Work list Query params — shared {@link HasanatListQuery} + FE-only `enabled`. */
export type HasanatPaginatedParams = HasanatListQuery & {
  page: number;
  enabled?: boolean;
};

export function buildHasanatPageUrl(params: HasanatPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? HASANAT_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir?.trim()) queryParams.set('sortDir', params.sortDir.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${HASANAT_API}/distributions?${queryParams.toString()}`;
}

export function hasanatListQueryKeyParams(params: HasanatPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? HASANAT_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    status: params.status?.trim() || '',
    sortField: params.sortField?.trim() || '',
    sortDir: params.sortDir?.trim() || '',
    includeDeleted: Boolean(params.includeDeleted),
  } as const;
}

export function hasanatPaginatedQueryKey(params: HasanatPaginatedParams) {
  return [...HASANAT_DISTRIBUTIONS_QUERY_KEY, 'page', hasanatListQueryKeyParams(params)] as const;
}

/** Keep previous page data only when filters match (avoid stale flash on filter change). */
export function sameHasanatListFilters(
  previous: ReturnType<typeof hasanatListQueryKeyParams> | undefined,
  next: ReturnType<typeof hasanatListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.status === next.status &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.includeDeleted === next.includeDeleted &&
    previous.limit === next.limit
  );
}