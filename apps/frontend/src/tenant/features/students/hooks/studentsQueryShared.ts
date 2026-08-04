import {
  STUDENTS_MODULE_MANIFEST,
  type StudentRecord,
  type StudentsListPageResult,
} from '@mms/shared';

export type { StudentRecord };

export const STUDENTS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const STUDENTS_METRICS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const STUDENTS_WIDGET_AGGREGATES_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const STUDENTS_API = STUDENTS_MODULE_MANIFEST.restBasePath;

export interface StudentsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
  enabled?: boolean;
}

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

export function studentsPaginatedQueryKey(params: StudentsPaginatedParams) {
  return [...STUDENTS_QUERY_KEY, 'page', params] as const;
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

export interface StudentsWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
  filters?: Array<{ field: string; operator?: 'equals' | 'contains' | 'gt' | 'lt'; value?: string }>;
  chartLimit?: number;
}

export type { StudentsListPageResult };
