/**
 * Cross-module public surface for Students Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/students/hooks/*`.
 */
export {
  STUDENTS_QUERY_KEY,
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  useStudentsPaginated,
  useStudentMutations,
  useStudentById,
  useStudentsByIds,
  useStudentLinkedContactIds,
  useStudentsMetrics,
  useStudentsWidgetAggregates,
  type StudentRecord,
} from '@/tenant/features/students/hooks/useStudents';
