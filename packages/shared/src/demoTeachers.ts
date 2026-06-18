import {
  DEMO_TEACHER_COUNT,
  buildDemoTeacherContacts,
  buildDemoTeachers,
} from './demoSeedBuilders.js';

export { DEMO_TEACHER_COUNT } from './demoSeedBuilders.js';

/** Faculty contact profiles (ids 1–{@link DEMO_TEACHER_COUNT}). */
export const DEMO_TEACHER_CONTACTS = buildDemoTeacherContacts();

/** Demo faculty rows — profile fields live on linked contacts. */
export const DEMO_TEACHERS = buildDemoTeachers();
