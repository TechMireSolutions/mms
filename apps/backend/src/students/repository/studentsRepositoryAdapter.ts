import {
  countStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
  saveStudent,
  bulkSaveStudents,
} from '../../db/repositories/studentRepository.js';
import type { Student } from '@mms/shared';
import {
  listStudentsPage,
  aggregateStudentsCommandMetrics,
  listActiveStudentsMissingGrNumber,
  bulkUpdateStudentsStatusSql,
} from '../../db/repositories/studentRepositoryList.js';
import {
  aggregateStudentsWidgetQueries,
  listStudentLinkedContactIdsSql,
  countStudentsForNextGrNumber,
  findStudentRegistrationConflictSql,
  findSoftDeletedStudentByContactIdSql,
} from '../../db/repositories/studentRepositoryWidgets.js';
import type { StudentsRepository } from './studentsRepository.js';

/**
 * Drizzle adapter for `StudentsRepository`.
 *
 * Delegates to the existing tenant-scoped Drizzle repository functions; the
 * interface is the contract use cases depend on (SSOT storage gateway).
 */
function createStudentsRepository(): StudentsRepository {
  return {
    countByWorkspace: (tenant, options) => countStudentsByWorkspace(tenant, options),
    listPage: (tenant, query) => listStudentsPage(tenant, query),
    findById: (tenant, id) => findStudentById(tenant, id),
    findByIds: (tenant, ids) => findStudentsByIds(tenant, ids),
    save: (tenant, student) => saveStudent(tenant, student as Student),
    bulkSave: (tenant, students) => bulkSaveStudents(tenant, students as Student[]),    aggregateCommandMetrics: (tenant, periodDays) =>
      aggregateStudentsCommandMetrics(tenant, periodDays),
    aggregateWidgetQueries: (tenant, queries) => aggregateStudentsWidgetQueries(tenant, queries),
    listLinkedContactIds: (tenant, excludeStudentId) =>
      listStudentLinkedContactIdsSql(tenant, excludeStudentId),
    countNextGrNumber: (tenant, input) =>
      countStudentsForNextGrNumber(tenant, input.regDate, input.restartAnnually),
    findRegistrationConflict: (tenant, input) =>
      findStudentRegistrationConflictSql(tenant, input),
    findSoftDeletedByContactId: (tenant, contactId) =>
      findSoftDeletedStudentByContactIdSql(tenant, contactId),
    listActiveMissingGrNumber: (tenant) => listActiveStudentsMissingGrNumber(tenant),
    bulkUpdateStatusSql: (tenant, ids, status) => bulkUpdateStudentsStatusSql(tenant, ids, status),
  };
}

/** Default Drizzle-backed instance used by the production use-case layer. */
export const studentsRepository: StudentsRepository = createStudentsRepository();
