import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';
import * as load from './teacherLoadUseCases.js';
import * as write from './teacherWriteUseCases.js';
import * as softDelete from './teacherSoftDeleteUseCases.js';
import * as operation from './teacherOperationUseCases.js';
import * as sanitize from './teacherSanitizeUseCases.js';

// Barrel — raw functions keep the repository interface as a trailing DI param.
export * from './teacherNormalizeUseCases.js';
export * from './teacherLoadUseCases.js';
export * from './teacherHydrateUseCases.js';
export * from './teacherWriteUseCases.js';
export * from './teacherSoftDeleteUseCases.js';
export * from './teacherOperationUseCases.js';
export * from './teacherSanitizeUseCases.js';

/**
 * Composition root — binds a `TeachersRepository` to every use case.
 *
 * Production uses the default Drizzle-backed `teacherUseCases`; tests can pass a
 * fake repository to exercise use-case orchestration in isolation.
 */
export function createTeachersUseCases(repo: TeachersRepository = teachersRepository) {
  return {
    countTeachers: (options?: Parameters<typeof load.countTeachers>[0]) =>
      load.countTeachers(options, repo),
    loadTeachersPage: (query: Parameters<typeof load.loadTeachersPage>[0]) =>
      load.loadTeachersPage(query, repo),
    loadTeacherById: (id: string, includeDeleted?: boolean) =>
      load.loadTeacherById(id, includeDeleted, repo),
    loadTeachersByIds: (ids: string[]) => load.loadTeachersByIds(ids, repo),
    loadTeacherLinkedContactIds: (excludeTeacherId?: string) =>
      load.loadTeacherLinkedContactIds(excludeTeacherId, repo),
    loadTeachersCommandMetrics: () => load.loadTeachersCommandMetrics(repo),
    loadTeachersWidgetAggregates: (queries: Parameters<typeof load.loadTeachersWidgetAggregates>[0]) =>
      load.loadTeachersWidgetAggregates(queries, repo),    createTeacher: (record: Parameters<typeof write.createTeacher>[0]) =>
      write.createTeacher(record, repo),
    updateTeacherById: (id: string, record: Parameters<typeof write.updateTeacherById>[1]) =>
      write.updateTeacherById(id, record, repo),
    softDeleteTeacherById: (id: string, deletedBy: string, deletionReason?: string) =>
      softDelete.softDeleteTeacherById(id, deletedBy, deletionReason, repo),
    deleteTeacherById: (id: string, deletedBy: string, deletionReason?: string) =>
      softDelete.softDeleteTeacherById(id, deletedBy, deletionReason, repo),
    bulkSoftDeleteTeachers: (ids: string[], deletedBy: string, deletionReason?: string) =>
      softDelete.bulkSoftDeleteTeachers(ids, deletedBy, deletionReason, repo),
    restoreTeacherById: (id: string) =>
      softDelete.restoreTeacherById(id, repo),
    bulkRestoreTeachers: (ids: string[]) =>
      softDelete.bulkRestoreTeachers(ids, repo),
    bulkUpdateTeacherStatus: (ids: string[], status: string) =>
      operation.bulkUpdateTeacherStatus(ids, status, repo),
    bulkUpdateTeacherSpecialization: (ids: string[], specialization: string) =>
      operation.bulkUpdateTeacherSpecialization(ids, specialization, repo),
    computeNextTeacherEmployeeIdForSettings: (
      settings: Parameters<typeof operation.computeNextTeacherEmployeeIdForSettings>[0],
    ) => operation.computeNextTeacherEmployeeIdForSettings(settings, repo),
    migrateTeachersMissingEmployeeIds: () =>
      operation.migrateTeachersMissingEmployeeIds(repo),
    checkTeacherRegistrationDuplicate: (
      input: Parameters<typeof operation.checkTeacherRegistrationDuplicate>[0],
    ) => operation.checkTeacherRegistrationDuplicate(input, repo),
    sanitizeTeacherForViewer: (teacher: import('@mms/shared').Teacher, viewerRole: string) =>
      sanitize.sanitizeTeacherForViewer(teacher, viewerRole),
    sanitizeTeachersForViewer: (teachers: import('@mms/shared').Teacher[], viewerRole: string) =>
      sanitize.sanitizeTeachersForViewer(teachers, viewerRole),
  };
}

type TeachersUseCases = ReturnType<typeof createTeachersUseCases>;

/** Default Drizzle-backed use-case instance used by routes and services. */
export const teacherUseCases: TeachersUseCases = createTeachersUseCases();
