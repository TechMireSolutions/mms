import { createModuleQueryInvalidator } from '@/lib/query/createModuleQueryInvalidator';
import { TEACHER_COUNT_QUERY_KEY } from '@/tenant/features/teachers/hooks/useTeacherCount';
import {
  TEACHERS_FIELD_CONFIG_QUERY_KEY,
  TEACHERS_PREFERENCES_QUERY_KEY,
} from '@/tenant/features/teachers/hooks/useTeacherSetupConfig';
import {
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/teachers/hooks/teachersQueryShared';
import { TEACHERS_LOOKUPS_QUERY_KEY } from '@/tenant/features/teachers/hooks/useTeacherLookups';

/** Invalidate Teachers list/metrics/setup/lookups Query keys (mutations + live push). */
export const invalidateTeachersQueries = createModuleQueryInvalidator({
  list: TEACHERS_QUERY_KEY,
  count: TEACHER_COUNT_QUERY_KEY,
  metrics: TEACHERS_METRICS_QUERY_KEY,
  widgetAggregates: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  fieldConfig: TEACHERS_FIELD_CONFIG_QUERY_KEY,
  preferences: TEACHERS_PREFERENCES_QUERY_KEY,
  lookups: TEACHERS_LOOKUPS_QUERY_KEY,
});
