import {
  TEACHERS_MODULE_MANIFEST,
  type TeacherRecord,
  type TeachersListPageResult,
  type TeachersListQuery,
} from '@mms/shared';
import {
  TEACHERS_API,
  TEACHERS_QUERY_KEY,
} from '@/tenant/features/teachers/hooks/teachersQueryKeys';

export type { TeacherRecord, TeachersListPageResult };

/** Work list Query params — shared {@link TeachersListQuery} + FE-only `enabled`. */
export type TeachersPaginatedParams = TeachersListQuery & {
  page: number;
  enabled?: boolean;
};

export function buildTeachersPageUrl(params: TeachersPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? TEACHERS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.specialization?.trim()) queryParams.set('specialization', params.specialization.trim());
  if (params.gender?.trim()) queryParams.set('gender', params.gender.trim());
  if (params.quickFilter && params.quickFilter !== 'all') queryParams.set('quickFilter', params.quickFilter);
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir?.trim()) queryParams.set('sortDir', params.sortDir.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${TEACHERS_API}?${queryParams.toString()}`;
}

export function teachersListQueryKeyParams(params: TeachersPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? TEACHERS_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    status: params.status?.trim() || '',
    specialization: params.specialization?.trim() || '',
    gender: params.gender?.trim() || '',
    quickFilter: params.quickFilter && params.quickFilter !== 'all' ? params.quickFilter : 'all',
    sortField: params.sortField?.trim() || '',
    sortDir: params.sortDir?.trim() || '',
    includeDeleted: Boolean(params.includeDeleted),
  } as const;
}

export function teachersPaginatedQueryKey(params: TeachersPaginatedParams) {
  return [...TEACHERS_QUERY_KEY, 'page', teachersListQueryKeyParams(params)] as const;
}

/** Keep previous page data only when filters match (avoid stale flash on filter change). */
export function sameTeachersListFilters(
  previous: ReturnType<typeof teachersListQueryKeyParams> | undefined,
  next: ReturnType<typeof teachersListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.status === next.status &&
    previous.specialization === next.specialization &&
    previous.gender === next.gender &&
    previous.quickFilter === next.quickFilter &&
    previous.includeDeleted === next.includeDeleted &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.limit === next.limit
  );
}
