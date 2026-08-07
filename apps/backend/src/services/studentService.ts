/** Students load, mutate, hydrate, and GR service API. */
export { hydrateStudentsFromContacts } from './studentServiceHydrate.js';
export {
  loadStudents,
  loadStudentById,
  loadStudentsByIds,
  loadStudentsWidgetAggregates,
  loadStudentsPage,
  countStudents,
  loadStudentsCommandMetrics,
  loadStudentLinkedContactIds,
  loadStudentFieldUsageCounts,
  loadStudentFieldUsageCount,
} from './studentServiceLoad.js';
export {
  createStudent,
  updateStudentById,
  deleteStudentById,
  restoreStudentById,
  bulkSoftDeleteStudents,
  bulkRestoreStudents,
  bulkUpdateStudentStatus,
} from './studentServiceMutate.js';
export {
  computeNextGrNumberForDate,
  checkStudentRegistrationDuplicate,
  migrateStudentsMissingGrNumbers,
} from './studentServiceGr.js';
