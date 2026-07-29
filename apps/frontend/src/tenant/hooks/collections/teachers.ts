/**
 * Cross-module public surface for Teachers Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/teachers/hooks/*`.
 */
export {
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  useTeachersPaginated,
  fetchAllTeachersForQuery,
  useTeacherMutations,
  useTeacherById,
  useTeachersByIds,
  useTeacherLinkedContactIds,
  useTeachersMetrics,
  useTeachersWidgetAggregates,
} from '@/tenant/features/teachers/hooks/useTeachers';
