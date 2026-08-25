/** Teachers list query SQL + page runner + ops — stable barrel. */
export { teacherStatusExpr } from './teacherRepositoryListQuerySql.js';
export { listTeachersPage } from './teacherRepositoryListQueryPage.js';
export {
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
} from './teacherRepositoryListQueryOps.js';
