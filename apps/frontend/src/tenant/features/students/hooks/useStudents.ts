export type { StudentRecord } from '@/tenant/features/students/hooks/studentsQueryKeys';

export {
  STUDENTS_QUERY_KEY,
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  type StudentsPaginatedParams,
  type StudentNextGrNumberParams,
  type StudentsWidgetAggregateWidgetInput,
} from '@/tenant/features/students/hooks/studentsQueryKeys';

export { useStudentMutations } from '@/tenant/features/students/hooks/useStudentMutations';

export {
  useStudentsPaginated,
  fetchAllStudentsForQuery,
  useStudentById,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
  checkStudentRegistrationDuplicate,
  useStudentsMetrics,
  useStudentsByIds,
  useStudentsWidgetAggregates,
} from '@/tenant/features/students/hooks/useStudentsQueries';
