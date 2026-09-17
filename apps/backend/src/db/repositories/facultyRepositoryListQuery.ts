/** Teachers list query SQL + page runner + ops — stable barrel. */
export { teacherStatusExpr } from './facultyRepositoryListQuerySql.js';
export { listTeachersPage } from './facultyRepositoryListQueryPage.js';
export {
  countTeachersActive,
  countTeachersForNextEmployeeId,
  type NextEmployeeIdCountOptions,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
} from './facultyRepositoryListQueryOps.js';
