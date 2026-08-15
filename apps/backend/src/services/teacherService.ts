/**
 * Teachers service seam (Clean Architecture).
 *
 * The feature module lives under `src/teachers/`: repository interface +
 * Drizzle adapter in `src/teachers/repository/`, orchestration use cases in
 * `src/teachers/use-cases/`. This file keeps the historical public import path
 * stable for cross-module consumers (e.g. `teachersExportService`) while binding
 * every export to the composition-root instance (`teacherUseCases`).
 */
import { teacherUseCases } from '../teachers/use-cases/teacherUseCases.js';

export const {
  createTeacher,
  updateTeacherById,
  deleteTeacherById,
  restoreTeacherById,
  bulkSoftDeleteTeachers,
  bulkRestoreTeachers,
  bulkUpdateTeacherStatus,
  loadTeacherById,
  loadTeachersByIds,
  loadTeachersWidgetAggregates,
  loadTeachersPage,
  countTeachers,
  loadTeachersCommandMetrics,
  loadTeacherLinkedContactIds,
  computeNextTeacherEmployeeIdForSettings,
} = teacherUseCases;
