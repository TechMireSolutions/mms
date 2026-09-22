import type { FacultyRepository } from '../repository/facultyRepository.js';
import { facultyRepository } from '../repository/facultyRepositoryAdapter.js';
import * as load from './facultyLoadUseCases.js';
import * as write from './facultyWriteUseCases.js';
import * as softDelete from './facultySoftDeleteUseCases.js';
import * as operation from './facultyOperationUseCases.js';
import * as sanitize from './facultySanitizeUseCases.js';

// Barrel — raw functions keep the repository interface as a trailing DI param.
export * from './facultyNormalizeUseCases.js';
export * from './facultyLoadUseCases.js';
export * from './facultyHydrateUseCases.js';
export * from './facultyWriteUseCases.js';
export * from './facultySoftDeleteUseCases.js';
export * from './facultyOperationUseCases.js';
export * from './facultySanitizeUseCases.js';

/**
 * Composition root — binds a `FacultyRepository` to every use case.
 *
 * Production uses the default Drizzle-backed `facultyUseCases`; tests can pass a
 * fake repository to exercise use-case orchestration in isolation.
 */
export function createFacultyUseCases(repo: FacultyRepository = facultyRepository) {
  const countTeachers = (options?: Parameters<typeof load.countTeachers>[0]) =>
    load.countTeachers(options, repo);
  const loadTeachersPage = (query: Parameters<typeof load.loadTeachersPage>[0]) =>
    load.loadTeachersPage(query, repo);
  const loadTeacherById = (id: string, includeDeleted?: boolean) =>
    load.loadTeacherById(id, includeDeleted, repo);
  const loadTeachersByIds = (ids: string[]) => load.loadTeachersByIds(ids, repo);
  const loadTeacherLinkedContactIds = (excludeTeacherId?: string) =>
    load.loadTeacherLinkedContactIds(excludeTeacherId, repo);
  const loadTeachersCommandMetrics = () => load.loadTeachersCommandMetrics(repo);
  const loadTeachersWidgetAggregates = (queries: Parameters<typeof load.loadTeachersWidgetAggregates>[0]) =>
    load.loadTeachersWidgetAggregates(queries, repo);
  const createTeacher = (
    record: Parameters<typeof write.createTeacher>[0],
    options?: Parameters<typeof write.createTeacher>[2],
  ) => write.createTeacher(record, repo, options);
  const updateTeacherById = (id: string, record: Parameters<typeof write.updateTeacherById>[1]) =>
    write.updateTeacherById(id, record, repo);
  const loadFacultyHierarchyTree = () => load.loadHierarchyTree(repo);
  const softDeleteTeacherById = (id: string, deletedBy: string, deletionReason?: string, reassignSubordinatesTo?: string) =>
    softDelete.softDeleteTeacherById(id, deletedBy, deletionReason, repo, reassignSubordinatesTo);
  const bulkSoftDeleteTeachers = (ids: string[], deletedBy: string, deletionReason?: string) =>
    softDelete.bulkSoftDeleteTeachers(ids, deletedBy, deletionReason, repo);
  const restoreTeacherById = (id: string, userId?: string) =>
    softDelete.restoreTeacherById(id, userId, repo);
  const bulkRestoreTeachers = (ids: string[], userId?: string) =>
    softDelete.bulkRestoreTeachers(ids, userId, repo);
  const bulkUpdateTeacherStatus = (ids: string[], status: string) =>
    operation.bulkUpdateTeacherStatus(ids, status, repo);
  const bulkUpdateTeacherSpecialization = (ids: string[], specialization: string) =>
    operation.bulkUpdateTeacherSpecialization(ids, specialization, repo);
  const computeNextTeacherEmployeeIdForSettings = (
    settings: Parameters<typeof operation.computeNextTeacherEmployeeIdForSettings>[0],
  ) => operation.computeNextTeacherEmployeeIdForSettings(settings, repo);
  const migrateTeachersMissingEmployeeIds = () =>
    operation.migrateTeachersMissingEmployeeIds(repo);
  const checkTeacherRegistrationDuplicate = (
    input: Parameters<typeof operation.checkTeacherRegistrationDuplicate>[0],
  ) => operation.checkTeacherRegistrationDuplicate(input, repo);
  const sanitizeTeacherForViewer = (teacher: import('@mms/shared').Teacher, viewerRole: string) =>
    sanitize.sanitizeTeacherForViewer(teacher, viewerRole);
  const sanitizeTeachersForViewer = (teachers: import('@mms/shared').Teacher[], viewerRole: string) =>
    sanitize.sanitizeTeachersForViewer(teachers, viewerRole);

  return {
    // Canonical Faculty methods
    countFaculty: countTeachers,
    loadFacultyPage: loadTeachersPage,
    loadFacultyById: loadTeacherById,
    loadFacultyByIds: loadTeachersByIds,
    loadFacultyLinkedContactIds: loadTeacherLinkedContactIds,
    loadFacultyCommandMetrics: loadTeachersCommandMetrics,
    loadFacultyWidgetAggregates: loadTeachersWidgetAggregates,
    loadFacultyHierarchyTree,
    createFaculty: createTeacher,
    updateFacultyById: updateTeacherById,
    softDeleteFacultyById: softDeleteTeacherById,
    deleteFacultyById: softDeleteTeacherById,
    bulkSoftDeleteFaculty: bulkSoftDeleteTeachers,
    restoreFacultyById: restoreTeacherById,
    bulkRestoreFaculty: bulkRestoreTeachers,
    bulkUpdateFacultyStatus: bulkUpdateTeacherStatus,
    bulkUpdateFacultySpecialization: bulkUpdateTeacherSpecialization,
    computeNextFacultyEmployeeIdForSettings: computeNextTeacherEmployeeIdForSettings,
    migrateFacultyMissingEmployeeIds: migrateTeachersMissingEmployeeIds,
    checkFacultyRegistrationDuplicate: checkTeacherRegistrationDuplicate,
    sanitizeFacultyForViewer: sanitizeTeacherForViewer,
    sanitizeFacultyListForViewer: sanitizeTeachersForViewer,

    // Backward-compatible Teacher methods
    countTeachers,
    loadTeachersPage,
    loadTeacherById,
    loadTeachersByIds,
    loadTeacherLinkedContactIds,
    loadTeachersCommandMetrics,
    loadTeachersWidgetAggregates,
    createTeacher,
    updateTeacherById,
    softDeleteTeacherById,
    deleteTeacherById: softDeleteTeacherById,
    bulkSoftDeleteTeachers,
    restoreTeacherById,
    bulkRestoreTeachers,
    bulkUpdateTeacherStatus,
    bulkUpdateTeacherSpecialization,
    computeNextTeacherEmployeeIdForSettings,
    migrateTeachersMissingEmployeeIds,
    checkTeacherRegistrationDuplicate,
    sanitizeTeacherForViewer,
    sanitizeTeachersForViewer,
  };
}


export type FacultyUseCases = ReturnType<typeof createFacultyUseCases>;
export type TeachersUseCases = FacultyUseCases;

export const createTeachersUseCases = createFacultyUseCases;
/** Default Drizzle-backed use-case instance used by routes and services. */
export const facultyUseCases: FacultyUseCases = createFacultyUseCases();
export const teacherUseCases: TeachersUseCases = facultyUseCases;
