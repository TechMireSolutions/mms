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

/** Teachers bulk-status + bulk-specialization + command metrics SQL. */
export {
  bulkUpdateTeachersStatusSql,
  bulkUpdateTeachersSpecializationSql,
  aggregateTeachersCommandMetrics,
} from './teacherRepositoryListOps.js';
