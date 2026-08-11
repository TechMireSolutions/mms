/**
 * Cross-module public surface for Teachers Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/teachers/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  useTeachersPaginated,
  fetchAllTeachersForQuery,
  useTeacherMutations,
  useTeachersByIds,
  useTeachersMetrics,
  useTeachersWidgetAggregates,
  type TeacherRecord,
} from '@/tenant/features/teachers/hooks/useTeachers';
export {
  useTeacherLookupsQuery,
} from '@/tenant/features/teachers/hooks/useTeacherLookups';
export {
  TEACHERS_FIELD_CONFIG_QUERY_KEY,
  TEACHERS_PREFERENCES_QUERY_KEY,
  useTeacherFieldConfigMutation,
  useTeacherPreferencesMutation,
  useComposedTeachersSettings,
} from '@/tenant/features/teachers/hooks/useTeacherSetupConfig';
export {
  setTeacherFieldConfigMemory,
  setTeacherPreferencesMemory,
} from '@/tenant/features/teachers/hooks/teacherSetupConfigApi';
export { applyTeachersWorkDrillDown } from '@/tenant/features/teachers/hooks/teachersWorkDrillDown';
export { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';
