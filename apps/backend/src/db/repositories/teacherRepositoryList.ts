/** Teachers list / count / linked-contact SQL — stable barrel. */
export {
  listTeachersPage,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
} from './teacherRepositoryListQuery.js';

/** Teachers bulk-status + command metrics SQL. */
export {
  bulkUpdateTeachersStatusSql,
  aggregateTeachersCommandMetrics,
} from './teacherRepositoryListOps.js';
