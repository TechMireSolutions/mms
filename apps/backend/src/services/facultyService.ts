/**
 * Faculty service seam (Clean Architecture).
 *
 * Feature module under `src/faculty/`: repository interface + Drizzle adapter
 * in `src/faculty/repository/`, orchestration use cases in `src/faculty/use-cases/`.
 */
import { facultyUseCases } from '../faculty/use-cases/facultyUseCases.js';

export const {
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

export const createFaculty = createTeacher;
export const updateFacultyById = updateTeacherById;
export const deleteFacultyById = deleteTeacherById;
export const restoreFacultyById = restoreTeacherById;
export const bulkSoftDeleteFaculty = bulkSoftDeleteTeachers;
export const bulkRestoreFaculty = bulkRestoreTeachers;
export const bulkUpdateFacultyStatus = bulkUpdateTeacherStatus;
export const bulkUpdateFacultySpecialization = bulkUpdateTeacherSpecialization;
export const loadFacultyById = loadTeacherById;
export const loadFacultyByIds = loadTeachersByIds;
export const loadFacultyWidgetAggregates = loadTeachersWidgetAggregates;
export const loadFacultyPage = loadTeachersPage;
export const countFaculty = countTeachers;
export const loadFacultyCommandMetrics = loadTeachersCommandMetrics;
export const loadFacultyLinkedContactIds = loadTeacherLinkedContactIds;
export const computeNextFacultyEmployeeIdForSettings = computeNextTeacherEmployeeIdForSettings;
export const checkFacultyRegistrationDuplicate = checkTeacherRegistrationDuplicate;
export const sanitizeFacultyForViewer = sanitizeTeacherForViewer;
export const sanitizeFacultyListForViewer = sanitizeTeachersForViewer;

export { facultyUseCases, facultyUseCases as teacherUseCases };
