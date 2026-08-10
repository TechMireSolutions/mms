import { createModuleQueryInvalidator } from '@/lib/query/createModuleQueryInvalidator';
import { STUDENT_COUNT_QUERY_KEY } from '@/tenant/features/students/hooks/useStudentCount';
import {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
} from '@/tenant/features/students/hooks/useStudentSetupConfig';
import {
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/students/hooks/studentsQueryKeys';
import { STUDENTS_LOOKUPS_QUERY_KEY } from '@/tenant/features/students/hooks/useStudentLookups';

/** Invalidate Students list/metrics/setup/lookups Query keys (mutations + live push). */
export const invalidateStudentsQueries = createModuleQueryInvalidator({
  list: STUDENTS_QUERY_KEY,
  count: STUDENT_COUNT_QUERY_KEY,
  metrics: STUDENTS_METRICS_QUERY_KEY,
  widgetAggregates: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  fieldConfig: STUDENTS_FIELD_CONFIG_QUERY_KEY,
  preferences: STUDENTS_PREFERENCES_QUERY_KEY,
  lookups: STUDENTS_LOOKUPS_QUERY_KEY,
});
