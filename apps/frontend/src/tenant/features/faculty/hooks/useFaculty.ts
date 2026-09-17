export type {
  Faculty,
  FacultyRecord,
  Teacher,
  TeacherRecord,
} from '@/tenant/features/faculty/hooks/facultyQueryShared';

export {
  FACULTY_API,
  FACULTY_QUERY_KEY,
  FACULTY_METRICS_QUERY_KEY,
  FACULTY_WIDGET_AGGREGATES_QUERY_KEY,
  type FacultyPaginatedParams,
  type FacultyNextEmployeeIdParams,
  type FacultyWidgetAggregateWidgetInput,
  type FacultyDirectoryQueryInput,
  buildFacultyPageUrl,
  buildFacultyDirectoryQuery,
  sameFacultyListFilters,
  facultyListQueryKeyParams,
  facultyPaginatedQueryKey,
  TEACHERS_API,
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  type TeachersPaginatedParams,
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
  type TeachersDirectoryQueryInput,
  buildTeachersPageUrl,
  buildTeachersDirectoryQuery,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from '@/tenant/features/faculty/hooks/facultyQueryShared';

export {
  useFacultyMutations,
  useTeacherMutations,
} from '@/tenant/features/faculty/hooks/useFacultyMutations';

export {
  fetchAllFacultyForQuery,
  useFacultyLinkedContactIds,
  useFacultyNextEmployeeId,
  facultyCommandMetricsQueryOptions,
  useFacultyMetrics,
  useFacultyByIds,
  useFacultyWidgetAggregates,
  checkFacultyRegistrationDuplicate,
  migrateFacultyEmployeeIds,
  fetchAllTeachersForQuery,
  useTeacherLinkedContactIds,
  useTeacherNextEmployeeId,
  teachersCommandMetricsQueryOptions,
  useTeachersMetrics,
  useTeachersByIds,
  useTeachersWidgetAggregates,
  checkTeacherRegistrationDuplicate,
  migrateTeachersEmployeeIds,
} from '@/tenant/features/faculty/hooks/useFacultyQueries';

