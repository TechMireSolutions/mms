import {
  FACULTY_MODULE_MANIFEST,
  type FacultyWidgetQuery,
  type TeachersWidgetQuery,
} from '@mms/shared';

export const FACULTY_QUERY_KEY = [FACULTY_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const FACULTY_METRICS_QUERY_KEY = [FACULTY_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const FACULTY_WIDGET_AGGREGATES_QUERY_KEY = [FACULTY_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const FACULTY_API = FACULTY_MODULE_MANIFEST.restBasePath;

export const TEACHERS_QUERY_KEY = FACULTY_QUERY_KEY;
export const TEACHERS_METRICS_QUERY_KEY = FACULTY_METRICS_QUERY_KEY;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = FACULTY_WIDGET_AGGREGATES_QUERY_KEY;
export const TEACHERS_API = FACULTY_API;

/** Page/filter URL builders + key helpers live beside the query keys (Students parity). */
export {
  buildFacultyPageUrl,
  facultyListQueryKeyParams,
  facultyPaginatedQueryKey,
  sameFacultyListFilters,
  buildTeachersPageUrl,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from './facultyListQueryBuilders.js';
export type {
  FacultyRecord,
  FacultyListPageResult,
  FacultyPaginatedParams,
  TeacherRecord,
  TeachersListPageResult,
  TeachersPaginatedParams,
} from './facultyListQueryBuilders.js';

export interface FacultyNextEmployeeIdParams {
  prefix?: string;
  template?: string;
  digits?: number;
  startSeq?: number;
  restartAnnually?: boolean;
  enabled?: boolean;
}
export type TeacherNextEmployeeIdParams = FacultyNextEmployeeIdParams;

/** Widget aggregate request — shared query + FE collection filter. */
export type FacultyWidgetAggregateWidgetInput = (FacultyWidgetQuery | TeachersWidgetQuery) & {
  collection: string;
};
export type TeachersWidgetAggregateWidgetInput = FacultyWidgetAggregateWidgetInput;

