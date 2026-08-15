import type { Teacher } from '@mms/shared';
import {
  bulkSaveTeachers,
  findTeacherById,
  findTeachersByIds,
  saveTeacher,
} from '../../db/repositories/teacherRepository.js';
import {
  aggregateTeachersCommandMetrics,
  bulkUpdateTeachersStatusSql,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  findSoftDeletedTeacherByContactIdSql,
  findTeacherRegistrationConflictSql,
  listActiveTeachersMissingEmployeeId,
  listTeacherLinkedContactIdsSql,
  listTeachersPage,
} from '../../db/repositories/teacherRepositoryList.js';
import { aggregateTeachersWidgetQueries } from '../../db/repositories/teacherRepositoryWidgets.js';
import type { TeachersRepository } from './teachersRepository.js';

/**
 * Drizzle adapter for `TeachersRepository`.
 *
 * Delegates to the existing tenant-scoped Drizzle repository functions; the
 * interface is the contract use cases depend on (SSOT storage gateway).
 */
function createTeachersRepository(): TeachersRepository {
  return {
    countByWorkspace: (tenant, options) => countTeachersActive(tenant, options),
    listPage: (tenant, query) => listTeachersPage(tenant, query),
    findById: (tenant, id) => findTeacherById(tenant, id),
    findByIds: (tenant, ids) => findTeachersByIds(tenant, ids),
    findSoftDeletedByContactId: (tenant, contactId) =>
      findSoftDeletedTeacherByContactIdSql(tenant, contactId),
    save: (tenant, teacher) => saveTeacher(tenant, teacher as Teacher),
    bulkSave: (tenant, teachers) => bulkSaveTeachers(tenant, teachers as Teacher[]),    aggregateCommandMetrics: (tenant, periodDays) =>
      aggregateTeachersCommandMetrics(tenant, periodDays),
    aggregateWidgetQueries: (tenant, queries) => aggregateTeachersWidgetQueries(tenant, queries),
    listLinkedContactIds: (tenant, excludeTeacherId) =>
      listTeacherLinkedContactIdsSql(tenant, excludeTeacherId),
    countNextEmployeeId: (tenant) => countTeachersForNextEmployeeId(tenant),
    listActiveMissingEmployeeId: (tenant) => listActiveTeachersMissingEmployeeId(tenant),
    findRegistrationConflict: (tenant, input) => findTeacherRegistrationConflictSql(tenant, input),
    bulkUpdateStatusSql: (tenant, ids, status) => bulkUpdateTeachersStatusSql(tenant, ids, status),
  };
}

/** Default Drizzle-backed instance used by the production use-case layer. */
export const teachersRepository: TeachersRepository = createTeachersRepository();
