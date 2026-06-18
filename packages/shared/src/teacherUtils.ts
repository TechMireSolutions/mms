import type { Teacher } from './teacherTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import { hydrateContactProfile, normalizeContactLinkedRecord } from './contactLinkPolicy.js';
import { DEMO_TEACHERS } from './demoTeachers.js';

/** Strips contact-owned fields before persisting a teacher linked to a contact. */
export function normalizeStoredTeacher<T extends Record<string, unknown>>(record: T): T {
  return normalizeContactLinkedRecord(record);
}

/** Demo teacher ids → contact ids in minimal seeds. */
export const DEMO_TEACHER_CONTACT_BY_ID: Record<string, number> = Object.fromEntries(
  DEMO_TEACHERS.map((teacher) => [teacher.id, Number(teacher.contactId)]),
);

/** Resolves display fields from the linked contact record. */
export function hydrateTeacherFromContact<T extends Teacher>(
  teacher: T,
  contacts: ContactLike[],
): T {
  return hydrateContactProfile(teacher as Record<string, unknown>, contacts, 'contactId') as T;
}
