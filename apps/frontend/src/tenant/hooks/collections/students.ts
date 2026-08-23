/**
 * Cross-module public surface for Students Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/students/hooks/*`.
 * Prefer paginated / by-id / metrics APIs.
 */
export {
  STUDENTS_QUERY_KEY,
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  fetchAllStudentsForQuery,
  useStudentMutations,
  useStudentsByIds,
  useStudentsMetrics,
  useStudentsWidgetAggregates,
  type StudentRecord,
} from '@/tenant/features/students/hooks/useStudents';
export {
  useStudentLookupsQuery,
} from '@/tenant/features/students/hooks/useStudentLookups';
export {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
  useStudentFieldConfigMutation,
  useStudentPreferencesMutation,
  useComposedStudentsSettings,
} from '@/tenant/features/students/hooks/useStudentSetupConfig';
export {
  setStudentFieldConfigMemory,
  setStudentPreferencesMemory,
} from '@/tenant/features/students/hooks/studentSetupConfigApi';
export { applyStudentsWorkDrillDown } from '@/tenant/features/students/hooks/studentsWorkDrillDown';
export { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useStudentsContractList,
  useStudentsContractCreate,
  useStudentsContractUpdate,
  useStudentsContractDelete,
  useStudentsContractBulkStatus,
  useStudentsContractBulkEnroll,
  useStudentsContractNextGrNumber,
  useStudentsContractDuplicateCheck,
} from '@/tenant/features/students/hooks/useStudentsTsrHooks';
