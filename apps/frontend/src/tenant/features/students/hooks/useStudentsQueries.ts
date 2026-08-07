/** Stable barrel — list + analytics query hooks (Contacts-shaped split). */
export {
  useStudentsPaginated,
  fetchAllStudentsForQuery,
  useStudentById,
  useStudentLinkedContactIds,
  useStudentsByIds,
} from "@/tenant/features/students/hooks/useStudentsListQueries";

export {
  useStudentNextGrNumber,
  checkStudentRegistrationDuplicate,
  useStudentsMetrics,
  useStudentsWidgetAggregates,
} from "@/tenant/features/students/hooks/useStudentsAnalyticsQueries";

export type {
  StudentsWidgetAggregateWidgetInput,
  StudentNextGrNumberParams,
  StudentsPaginatedParams,
} from "@/tenant/features/students/hooks/studentsQueryKeys";
