import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeacherRecord,
  type TeacherSortField,
  type TeachersListPageResult,
  type TeachersListQuery,
  type TeachersWidgetQuery,
} from '@mms/shared';

export type { TeacherRecord, Teacher, TeachersListPageResult, TeachersListQuery };

export const TEACHERS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const TEACHERS_METRICS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const TEACHERS_API = TEACHERS_MODULE_MANIFEST.restBasePath;

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
  if (params.specialization) queryParams.set('specialization', params.specialization);
  if (params.sortField) queryParams.set('sortField', params.sortField);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${TEACHERS_API}?${queryParams.toString()}`;
}

export interface TeachersDirectoryQueryInput {
  search?: string;
  filterStatus: string[];
  filterSpecialization: string;
  sortField: TeacherSortField | null | undefined;
  sortDir: 'asc' | 'desc';
}

/** Directory filter state → {@link TeachersListQuery} (Work page + server CSV share this). */
export function buildTeachersDirectoryQuery({
  search,
  filterStatus,
  filterSpecialization,
  sortField,
  sortDir,
}: TeachersDirectoryQueryInput): TeachersListQuery {
  return {
    search: search?.trim() || undefined,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    sortField: sortField ?? undefined,
    sortDir: sortField ? sortDir : undefined,
  };
}

export function teachersPaginatedQueryKey(params: TeachersPaginatedParams) {
  return [...TEACHERS_QUERY_KEY, 'page', params] as const;
}

export function teacherDetailQueryKey(teacherId: string) {
  return [...TEACHERS_QUERY_KEY, 'by-id', teacherId] as const;
}

export interface TeacherNextEmployeeIdParams {
  prefix?: string;
  enabled?: boolean;
}

/** Widget aggregate request — shared query + FE collection filter. */
export type TeachersWidgetAggregateWidgetInput = TeachersWidgetQuery & {
  collection: string;
};
