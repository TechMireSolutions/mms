import { TEACHERS_MODULE_MANIFEST, type TeachersWidgetQuery } from '@mms/shared';

export const TEACHERS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const TEACHER_COUNT_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'count'] as const;
export const TEACHERS_METRICS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const TEACHERS_API = TEACHERS_MODULE_MANIFEST.restBasePath;

/** Page/filter URL builders + key helpers live beside the query keys (Students parity). */
export {
  buildTeachersPageUrl,
  fetchTeacherById,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from './teachersListQueryBuilders.js';
export type {
  TeacherRecord,
  TeachersListPageResult,
  TeachersPaginatedParams,
} from './teachersListQueryBuilders.js';

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
