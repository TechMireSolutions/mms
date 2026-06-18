import type { Teacher } from './teacherTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import { hydrateContactProfile, normalizeContactLinkedRecord } from './contactLinkPolicy.js';

/** Strips contact-owned fields before persisting a teacher linked to a contact. */
export function normalizeStoredTeacher<T extends Record<string, unknown>>(record: T): T {
  return normalizeContactLinkedRecord(record);
}

/** Demo teacher ids → contact ids in default seeds (contacts 1–5). */
export const DEMO_TEACHER_CONTACT_BY_ID: Record<string, number> = {
  tch1: 1,
  tch2: 3,
  tch3: 2,
  tch4: 4,
  tch5: 5,
};

/** Resolves display fields from the linked contact record. */
export function hydrateTeacherFromContact<T extends Teacher>(
  teacher: T,
  contacts: ContactLike[],
): T {
  return hydrateContactProfile(teacher as Record<string, unknown>, contacts, 'contactId') as T;
}
