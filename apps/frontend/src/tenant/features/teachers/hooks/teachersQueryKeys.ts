import { TEACHERS_MODULE_MANIFEST, type TeachersWidgetQuery } from '@mms/shared';

export const TEACHERS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const TEACHERS_METRICS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const TEACHERS_API = TEACHERS_MODULE_MANIFEST.restBasePath;

/** Page/filter URL builders + key helpers live beside the query keys (Students parity). */
export {
  buildTeachersPageUrl,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from './teachersListQueryBuilders.js';
export type {
  TeacherRecord,
  TeachersListPageResult,
  TeachersPaginatedParams,
} from './teachersListQueryBuilders.js';

export interface TeacherNextEmployeeIdParams {
  prefix?: string;
  enabled?: boolean;
}

/** Widget aggregate request — shared query + FE collection filter. */
export type TeachersWidgetAggregateWidgetInput = TeachersWidgetQuery & {
  collection: string;
};
