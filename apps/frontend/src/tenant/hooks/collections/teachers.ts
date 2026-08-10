/**
 * Cross-module public surface for Teachers Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/teachers/hooks/*`.
 */
export {
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  useTeachersPaginated,
  useTeacherMutations,
  useTeachersByIds,
  useTeacherLinkedContactIds,
  useTeachersMetrics,
  useTeachersWidgetAggregates,
} from '@/tenant/features/teachers/hooks/useTeachers';
export {
  TEACHERS_FIELD_CONFIG_QUERY_KEY,
  TEACHERS_PREFERENCES_QUERY_KEY,
  useTeacherFieldConfigQuery,
  useTeacherFieldConfigMutation,
  useTeacherPreferencesQuery,
  useTeacherPreferencesMutation,
  useComposedTeachersSettings,
} from '@/tenant/features/teachers/hooks/useTeacherSetupConfig';
export {
  TEACHERS_LOOKUPS_QUERY_KEY,
  useTeacherLookupsQuery,
  useTeacherLookupMutation,
} from '@/tenant/features/teachers/hooks/useTeacherLookups';
