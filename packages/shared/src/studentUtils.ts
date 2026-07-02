import type { ContactLike } from './contactLinkPolicy.js';
import {
  hydrateContactProfile,
  hydrateParentContactNames,
  normalizeContactLinkedRecord,
  normalizeParentContactLinks,
} from './contactLinkPolicy.js';
import type { Student } from './studentTypes.js';

/** Strips contact-owned fields before persisting a student row. */
export function normalizeStoredStudent<T extends Record<string, unknown>>(record: T): T {
  let normalizedStudent = normalizeContactLinkedRecord(record);
  normalizedStudent = normalizeParentContactLinks(normalizedStudent);
  return normalizedStudent;
}

/** Hydrates student + parent display fields from contacts. */
export function hydrateStudentFromContacts<T extends Student>(
  student: T,
  contacts: ContactLike[],
): T {
  return hydrateParentContactNames(
    hydrateContactProfile(student, contacts),
    contacts,
  ) as T;
}
