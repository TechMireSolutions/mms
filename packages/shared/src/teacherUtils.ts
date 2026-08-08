import type { Teacher } from './teacherTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import { hydrateContactProfile, normalizeContactLinkedRecord } from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import { DEMO_TEACHERS } from './demoTeachers.js';

/** Strip client soft-delete metadata from teacher create/update payloads. */
export function stripTeacherClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = stripContactClientSoftDeleteFields(record) as Record<string, unknown>;
  delete next.deleted;
  return next as T;
}

/** Strips contact-owned fields and client soft-delete metadata before persisting a teacher row. */
export function normalizeStoredTeacher<T extends Record<string, unknown>>(record: T): T {
  return normalizeContactLinkedRecord(stripTeacherClientSoftDeleteFields(record));
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
