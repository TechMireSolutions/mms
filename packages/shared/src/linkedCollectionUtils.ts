/** Linked-entity normalize/hydrate helpers across modules. */
export * from './linkedSessionUtils.js';
export * from './linkedStudentRowUtils.js';
export * from './linkedUserUtils.js';
export * from './linkedHasanatUtils.js';
export * from './linkedAssessmentUtils.js';
export * from './linkedActorUtils.js';
export {
  normalizeStoredStudent,
  hydrateStudentFromContacts,
} from './studentUtils.js';
export {
  normalizeStoredTeacher,
  hydrateTeacherFromContact,
} from './teacherUtils.js';
export type { Student } from './studentTypes.js';
export type { Teacher } from './teacherTypes.js';
