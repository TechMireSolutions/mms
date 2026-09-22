import type { Teacher } from '@mms/shared';
import {
  bulkSaveTeachers,
  findTeacherById,
  findTeachersByIds,
  saveTeacher,
  countSubordinates,
  countSubordinatesBatch,
  findSubordinates,
  reassignSubordinates,
} from '../../db/repositories/facultyRepository.js';
import {
  aggregateTeachersCommandMetrics,
  bulkUpdateTeachersSpecializationSql,
  bulkUpdateTeachersStatusSql,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  listTeachersPage,
} from '../../db/repositories/facultyRepositoryList.js';
import { aggregateTeachersWidgetQueries } from '../../db/repositories/facultyRepositoryWidgets.js';
import type { FacultyRepository, TeachersRepository } from './facultyRepository.js';

/**
 * Drizzle adapter for `FacultyRepository`.
 *
 * Delegates to the existing tenant-scoped Drizzle repository functions; the
 * interface is the contract use cases depend on (SSOT storage gateway).
 */
function createFacultyRepository(): FacultyRepository {
  return {
    countByWorkspace: (tenant, options) => countTeachersActive(tenant, options),
    listPage: (tenant, query) => listTeachersPage(tenant, query),
    findById: (tenant, id) => findTeacherById(tenant, id),
    findByIds: (tenant, ids) => findTeachersByIds(tenant, ids),
    findSoftDeletedByContactId: (tenant, contactId) =>
      findSoftDeletedTeacherByContactIdSql(tenant, contactId),
    save: (tenant, teacher) => saveTeacher(tenant, teacher as Teacher),
    bulkSave: (tenant, teachers) => bulkSaveTeachers(tenant, teachers as Teacher[]),
    aggregateCommandMetrics: (tenant, periodDays) =>
      aggregateTeachersCommandMetrics(tenant, periodDays),
    aggregateWidgetQueries: (tenant, queries) => aggregateTeachersWidgetQueries(tenant, queries),
    listLinkedContactIds: (tenant, excludeTeacherId) =>
      listTeacherLinkedContactIdsSql(tenant, excludeTeacherId),
    countNextEmployeeId: (tenant, options) => countTeachersForNextEmployeeId(tenant, options),
    listActiveMissingEmployeeId: (tenant) => listActiveTeachersMissingEmployeeId(tenant),
    findRegistrationConflict: (tenant, input) => findTeacherRegistrationConflictSql(tenant, input),
    bulkUpdateStatusSql: (tenant, ids, status) => bulkUpdateTeachersStatusSql(tenant, ids, status),
    bulkUpdateSpecializationSql: (tenant, ids, specialization) =>
      bulkUpdateTeachersSpecializationSql(tenant, ids, specialization),
    countSubordinates: (tenant, supervisorId) => countSubordinates(tenant, supervisorId),
    countSubordinatesBatch: (tenant, supervisorIds) => countSubordinatesBatch(tenant, supervisorIds),
    findSubordinates: (tenant, supervisorId) => findSubordinates(tenant, supervisorId),
    reassignSubordinates: (tenant, oldSupervisorId, newSupervisorId) =>
      reassignSubordinates(tenant, oldSupervisorId, newSupervisorId),
  };
}

/** Default Drizzle-backed instance used by the production use-case layer. */
export const facultyRepository: FacultyRepository = createFacultyRepository();
export const teachersRepository: TeachersRepository = facultyRepository;
