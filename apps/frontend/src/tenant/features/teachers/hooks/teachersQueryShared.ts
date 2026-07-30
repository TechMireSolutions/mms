import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeacherRecord,
  type TeachersListPageResult,
} from '@mms/shared';

export type { TeacherRecord, Teacher, TeachersListPageResult };

export const TEACHERS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const TEACHERS_METRICS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const TEACHERS_API = TEACHERS_MODULE_MANIFEST.restBasePath;

export interface TeachersPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  specialization?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
  enabled?: boolean;
}

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

export interface TeachersWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
}
