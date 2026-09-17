/**
 * Cross-module public surface for Faculty Query hooks.
 * Preferred over importing from `@/tenant/features/faculty/*`.
 */
export {
  FACULTY_QUERY_KEY,
  FACULTY_METRICS_QUERY_KEY,
  FACULTY_WIDGET_AGGREGATES_QUERY_KEY,
  fetchAllFacultyForQuery,
  facultyCommandMetricsQueryOptions,
  useFacultyMutations,
  useFacultyByIds,
  useFacultyMetrics,
  useFacultyWidgetAggregates,
  type FacultyRecord,
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  fetchAllTeachersForQuery,
  teachersCommandMetricsQueryOptions,
  useTeacherMutations,
  useTeachersByIds,
  useTeachersMetrics,
  useTeachersWidgetAggregates,
  type TeacherRecord,
} from '@/tenant/features/faculty/hooks/useFaculty';

export {
  useFacultyLookupsQuery,
  useTeacherLookupsQuery,
} from '@/tenant/features/faculty/hooks/useFacultyLookups';

export {
  FACULTY_PREFERENCES_QUERY_KEY,
  useFacultyPreferencesMutation,
  useComposedFacultySettings,
  TEACHERS_PREFERENCES_QUERY_KEY,
  useTeacherPreferencesMutation,
  useComposedTeachersSettings,
} from '@/tenant/features/faculty/hooks/useFacultySetupConfig';

export {
  setFacultyPreferencesMemory,
  setTeacherPreferencesMemory,
} from '@/tenant/features/faculty/hooks/facultySetupConfigApi';

export {
  applyTeachersWorkDrillDown as applyFacultyWorkDrillDown,
  applyTeachersWorkDrillDown,
} from '@/tenant/features/faculty/hooks/facultyWorkDrillDown';

export {
  invalidateFacultyQueries,
  invalidateTeachersQueries,
} from '@/tenant/features/faculty/hooks/invalidateFacultyQueries';

export {
  facultyListQueryOptions,
  useFacultyContractList,
  useFacultyContractGet,
  useFacultyContractCreate,
  useFacultyContractUpdate,
  useFacultyContractDelete,
  useFacultyContractBulkStatus,
  useFacultyContractDuplicateCheck,
  useFacultyContractNextEmployeeId,
  teachersListQueryOptions,
  useTeachersContractList,
  useTeachersContractGet,
  useTeachersContractCreate,
  useTeachersContractUpdate,
  useTeachersContractDelete,
  useTeachersContractBulkStatus,
  useTeachersContractDuplicateCheck,
  useTeachersContractNextEmployeeId,
} from '@/tenant/features/faculty/hooks/useFacultyTsrHooks';

