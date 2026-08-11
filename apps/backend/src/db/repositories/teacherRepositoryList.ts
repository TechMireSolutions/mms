/** Teachers list / count / linked-contact SQL — stable barrel. */
export {
  listTeachersPage,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
} from './teacherRepositoryListQuery.js';

/** Teachers bulk-status + command metrics SQL. */
export {
  bulkUpdateTeachersStatusSql,
  aggregateTeachersCommandMetrics,
} from './teacherRepositoryListOps.js';
