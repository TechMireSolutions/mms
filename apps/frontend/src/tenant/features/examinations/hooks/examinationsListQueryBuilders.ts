import {
  EXAMINATIONS_MODULE_MANIFEST,
  type Exam,
  type ExaminationsListPageResult,
  type ExaminationsListQuery,
} from '@mms/shared';
import {
  EXAMINATIONS_API,
  EXAMINATIONS_EXAMS_QUERY_KEY,
} from '@/tenant/features/examinations/hooks/useExaminationsApi';

export type { Exam, ExaminationsListPageResult };

/** Work list Query params — shared {@link ExaminationsListQuery} + FE-only `enabled`. */
export type ExaminationsPaginatedParams = ExaminationsListQuery & {
  page: number;
  enabled?: boolean;
};

export function buildExaminationsPageUrl(params: ExaminationsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? EXAMINATIONS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir?.trim()) queryParams.set('sortDir', params.sortDir.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${EXAMINATIONS_API}/exams?${queryParams.toString()}`;
}

export function examinationsListQueryKeyParams(params: ExaminationsPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? EXAMINATIONS_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    status: params.status?.trim() || '',
    sortField: params.sortField?.trim() || '',
    sortDir: params.sortDir?.trim() || '',
    includeDeleted: Boolean(params.includeDeleted),
  } as const;
}

export function examinationsPaginatedQueryKey(params: ExaminationsPaginatedParams) {
  return [...EXAMINATIONS_EXAMS_QUERY_KEY, 'page', examinationsListQueryKeyParams(params)] as const;
}

/** Keep previous page data only when filters match (avoid stale flash on filter change). */
export function sameExaminationsListFilters(
  previous: ReturnType<typeof examinationsListQueryKeyParams> | undefined,
  next: ReturnType<typeof examinationsListQueryKeyParams>,
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