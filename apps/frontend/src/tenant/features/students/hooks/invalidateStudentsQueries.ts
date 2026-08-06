import type { QueryClient } from '@tanstack/react-query';
import { STUDENT_COUNT_QUERY_KEY } from '@/tenant/features/students/hooks/useStudentCount';
import {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
} from '@/tenant/features/students/hooks/useStudentSetupConfig';
import {
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/students/hooks/studentsQueryShared';

/** Invalidate Students list/metrics/setup Query keys (mutations + live push). */
export function invalidateStudentsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: STUDENT_COUNT_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: STUDENTS_METRICS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: STUDENTS_PREFERENCES_QUERY_KEY });
}
