export {
  teacherStatusExpr,
  listTeachersPage,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
} from './facultyRepositoryListQuery.js';
export {
  bulkUpdateTeachersStatusSql,
  bulkUpdateTeachersSpecializationSql,
  aggregateTeachersCommandMetrics,
} from './facultyRepositoryListOps.js';

import {
  listTeachersPage,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
} from './facultyRepositoryListQuery.js';
import {
  bulkUpdateTeachersStatusSql,
  bulkUpdateTeachersSpecializationSql,
  aggregateTeachersCommandMetrics,
} from './facultyRepositoryListOps.js';

export const listFacultyPage = listTeachersPage;
export const countFacultyActive = countTeachersActive;
export const countFacultyForNextEmployeeId = countTeachersForNextEmployeeId;
export const listActiveFacultyMissingEmployeeId = listActiveTeachersMissingEmployeeId;
export const listFacultyLinkedContactIdsSql = listTeacherLinkedContactIdsSql;
export const findSoftDeletedFacultyByContactIdSql = findSoftDeletedTeacherByContactIdSql;
export const findFacultyRegistrationConflictSql = findTeacherRegistrationConflictSql;
export const bulkUpdateFacultyStatusSql = bulkUpdateTeachersStatusSql;
export const bulkUpdateFacultySpecializationSql = bulkUpdateTeachersSpecializationSql;
export const aggregateFacultyCommandMetrics = aggregateTeachersCommandMetrics;
