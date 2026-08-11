import { STUDENTS_MODULE_MANIFEST, type StudentsWidgetQuery } from '@mms/shared';

export const STUDENTS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'list'] as const;
export const STUDENT_COUNT_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'count'] as const;
export const STUDENTS_METRICS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'metrics'] as const;
export const STUDENTS_WIDGET_AGGREGATES_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'widget-aggregates'] as const;

export const STUDENTS_API = STUDENTS_MODULE_MANIFEST.restBasePath;

/** Page/filter URL builders + key helpers live beside the query keys (Contacts parity). */
export {
  buildStudentsPageUrl,
  sameStudentsListFilters,
  studentsListQueryKeyParams,
  studentsPaginatedQueryKey,
} from './studentsListQueryBuilders.js';
export type {
  StudentRecord,
  StudentsListPageResult,
  StudentsPaginatedParams,
} from './studentsListQueryBuilders.js';

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
