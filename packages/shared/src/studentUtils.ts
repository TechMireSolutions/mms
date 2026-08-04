import type { ContactLike } from './contactLinkPolicy.js';
import {
  hydrateContactProfile,
  hydrateParentContactNames,
  normalizeContactLinkedRecord,
  normalizeParentContactLinks,
} from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import type { Student } from './studentTypes.js';

/** Strip client soft-delete metadata from student create/update payloads. */
export function stripStudentClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  return stripContactClientSoftDeleteFields(record);
}

/** Strips contact-owned fields and client soft-delete metadata before persisting a student row. */
export function normalizeStoredStudent<T extends Record<string, unknown>>(record: T): T {
  let normalizedStudent = stripStudentClientSoftDeleteFields(record);
  normalizedStudent = normalizeContactLinkedRecord(normalizedStudent);
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
