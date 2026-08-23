/** Stable barrel — list + analytics query hooks (Contacts-shaped split). */
export {
  fetchAllStudentsForQuery,
  useStudentLinkedContactIds,
  useStudentsByIds,
} from "@/tenant/features/students/hooks/useStudentsListQueries";

export {
  useStudentNextGrNumber,
  checkStudentRegistrationDuplicate,
  useStudentsMetrics,
  useStudentsWidgetAggregates,
} from "@/tenant/features/students/hooks/useStudentsAnalyticsQueries";
