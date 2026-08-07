/**
 * Cross-module public surface for Students Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/students/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  STUDENTS_QUERY_KEY,
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  useStudentsPaginated,
  fetchAllStudentsForQuery,
  useStudentMutations,
  useStudentById,
  useStudentsByIds,
  useStudentLinkedContactIds,
  useStudentsMetrics,
  useStudentsWidgetAggregates,
  type StudentRecord,
} from '@/tenant/features/students/hooks/useStudents';
export {
  STUDENTS_LOOKUPS_QUERY_KEY,
  useStudentLookupsQuery,
  useStudentLookupMutation,
} from '@/tenant/features/students/hooks/useStudentLookups';
export {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
  useStudentFieldConfigQuery,
  useStudentFieldConfigMutation,
  useStudentPreferencesQuery,
  useStudentPreferencesMutation,
  useComposedStudentsSettings,
} from '@/tenant/features/students/hooks/useStudentSetupConfig';
