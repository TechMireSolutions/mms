/**
 * Faculty service seam (Clean Architecture).
 *
 * Feature module under `src/faculty/`: repository interface + Drizzle adapter
 * in `src/faculty/repository/`, orchestration use cases in `src/faculty/use-cases/`.
 */
import { facultyUseCases } from '../faculty/use-cases/facultyUseCases.js';

export const {
  // Canonical Faculty exports
  createFaculty,
  updateFacultyById,
  deleteFacultyById,
  softDeleteFacultyById,
  restoreFacultyById,
  bulkSoftDeleteFaculty,
  bulkRestoreFaculty,
  bulkUpdateFacultyStatus,
  bulkUpdateFacultySpecialization,
  loadFacultyById,
  loadFacultyByIds,
  loadFacultyWidgetAggregates,
  loadFacultyPage,
  countFaculty,
  loadFacultyCommandMetrics,
  loadFacultyLinkedContactIds,
  loadFacultyHierarchyTree,
  computeNextFacultyEmployeeIdForSettings,
  migrateFacultyMissingEmployeeIds,
  checkFacultyRegistrationDuplicate,
  sanitizeFacultyForViewer,
  sanitizeFacultyListForViewer,

  // Backward compatibility alias exports
  createTeacher,
  updateTeacherById,
  deleteTeacherById,
  restoreTeacherById,
  bulkSoftDeleteTeachers,
  bulkRestoreTeachers,
  bulkUpdateTeacherStatus,
  bulkUpdateTeacherSpecialization,
  loadTeacherById,
  loadTeachersByIds,
  loadTeachersWidgetAggregates,
  loadTeachersPage,
  countTeachers,
  loadTeachersCommandMetrics,
  loadTeacherLinkedContactIds,
  computeNextTeacherEmployeeIdForSettings,
  migrateTeachersMissingEmployeeIds,
  checkTeacherRegistrationDuplicate,
  sanitizeTeacherForViewer,
  sanitizeTeachersForViewer,
} = facultyUseCases;

export { facultyUseCases, facultyUseCases as teacherUseCases };
