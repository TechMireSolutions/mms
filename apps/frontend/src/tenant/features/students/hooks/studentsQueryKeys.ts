import {
  STUDENTS_MODULE_MANIFEST,
  type StudentRecord,
  type StudentsListPageResult,
  type StudentsListQuery,
  type StudentsWidgetQuery,
} from '@mms/shared';

export type { StudentRecord };

export const STUDENTS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const STUDENTS_METRICS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const STUDENTS_WIDGET_AGGREGATES_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const STUDENTS_API = STUDENTS_MODULE_MANIFEST.restBasePath;

/** Work list Query params — shared {@link StudentsListQuery} + FE-only `enabled`. */
export type StudentsPaginatedParams = StudentsListQuery & {
  page: number;
  enabled?: boolean;
};

export function buildStudentsPageUrl(params: StudentsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? STUDENTS_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.gender?.trim()) queryParams.set('gender', params.gender.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir?.trim()) queryParams.set('sortDir', params.sortDir.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${STUDENTS_API}?${queryParams.toString()}`;
}

export function studentsListQueryKeyParams(params: StudentsPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? STUDENTS_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    status: params.status?.trim() || '',
    gender: params.gender?.trim() || '',
    sortField: params.sortField?.trim() || '',
    sortDir: params.sortDir?.trim() || '',
    includeDeleted: Boolean(params.includeDeleted),
  } as const;
}

export function studentsPaginatedQueryKey(params: StudentsPaginatedParams) {
  return [...STUDENTS_QUERY_KEY, 'page', studentsListQueryKeyParams(params)] as const;
}

/** Keep previous page data only when filters match (avoid stale flash on filter change). */
export function sameStudentsListFilters(
  previous: ReturnType<typeof studentsListQueryKeyParams> | undefined,
  next: ReturnType<typeof studentsListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.status === next.status &&
    previous.gender === next.gender &&
    previous.includeDeleted === next.includeDeleted &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.limit === next.limit
  );
}

export function studentDetailQueryKey(studentId: string) {
  return [...STUDENTS_QUERY_KEY, 'by-id', studentId] as const;
}

export interface StudentNextGrNumberParams {
  registeredDate: string;
  template?: string;
  digits?: number;
  restartAnnually?: boolean;
  enabled?: boolean;
}

/** Widget aggregate request — shared query + FE collection filter. */
export type StudentsWidgetAggregateWidgetInput = StudentsWidgetQuery & {
  collection: string;
};

export type { StudentsListPageResult };
