/**
 * Cross-module public surface for Teachers Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/teachers/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
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
  
  TEACHERS_PREFERENCES_QUERY_KEY,
  
  useTeacherPreferencesMutation,
  useComposedTeachersSettings,
} from '@/tenant/features/teachers/hooks/useTeacherSetupConfig';
export {
  
  setTeacherPreferencesMemory,
} from '@/tenant/features/teachers/hooks/teacherSetupConfigApi';
export { applyTeachersWorkDrillDown } from '@/tenant/features/teachers/hooks/teachersWorkDrillDown';
export { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useTeachersContractList,
  useTeachersContractGet,
  useTeachersContractCreate,
  useTeachersContractUpdate,
  useTeachersContractDelete,
  useTeachersContractBulkStatus,
  useTeachersContractDuplicateCheck,
  useTeachersContractNextEmployeeId,
} from '@/tenant/features/teachers/hooks/useTeachersTsrHooks';
