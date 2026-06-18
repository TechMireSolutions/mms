import {
  DEMO_STUDENT_COUNT,
  buildDemoStudentContacts,
  buildDemoStudentParentContacts,
  buildDemoStudents,
} from './demoSeedBuilders.js';

export { DEMO_STUDENT_COUNT } from './demoSeedBuilders.js';

/** Student contact profiles (ids 1001…). */
export const DEMO_STUDENT_CONTACTS = buildDemoStudentContacts();

/** Parent contacts for demo students (ids 2001…). */
export const DEMO_STUDENT_PARENT_CONTACTS = buildDemoStudentParentContacts();

/** All contacts required for demo students (students + parents). */
export const DEMO_STUDENT_CONTACTS_ALL = [
  ...DEMO_STUDENT_CONTACTS,
  ...DEMO_STUDENT_PARENT_CONTACTS,
];

/** Demo student rows — profile fields live on linked contacts. */
export const DEMO_STUDENTS = buildDemoStudents();

/** Demo student ids → primary contact ids. */
export const DEMO_STUDENT_CONTACT_BY_ID: Record<string, number> = Object.fromEntries(
  DEMO_STUDENTS.map((student) => [student.id, Number(student.contactId)]),
);
