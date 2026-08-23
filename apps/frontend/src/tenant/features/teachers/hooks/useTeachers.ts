export type { TeacherRecord, Teacher } from '@/tenant/features/teachers/hooks/teachersQueryShared';

export {
  TEACHERS_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  type TeachersPaginatedParams,
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/teachers/hooks/teachersQueryShared';

export { useTeacherMutations } from '@/tenant/features/teachers/hooks/useTeacherMutations';

export {
  fetchAllTeachersForQuery,
  useTeacherLinkedContactIds,
  useTeacherNextEmployeeId,
  useTeachersMetrics,
  useTeachersByIds,
  useTeachersWidgetAggregates,
  checkTeacherRegistrationDuplicate,
  migrateTeachersEmployeeIds,
} from '@/tenant/features/teachers/hooks/useTeachersQueries';
