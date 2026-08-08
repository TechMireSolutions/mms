import type { QueryClient } from '@tanstack/react-query';
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
export function invalidateTeachersQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHER_COUNT_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHERS_METRICS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHERS_FIELD_CONFIG_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHERS_PREFERENCES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TEACHERS_LOOKUPS_QUERY_KEY });
}
