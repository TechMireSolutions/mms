import type { Teacher } from './teacherTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import {
  CONTACT_PROFILE_FIELDS,
  hydrateContactProfile,
  stripRecordFields,
} from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import { DEMO_TEACHERS } from './demoTeachers.js';

/** Strip client soft-delete metadata from teacher create/update payloads. */
export function stripTeacherClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = stripContactClientSoftDeleteFields(record) as Record<string, unknown>;
  delete next.deleted;
  return next as T;
}

/**
 * Soft-delete + Contacts profile dual-write strip shared by wire preprocess and dynamic Zod.
 * Does not mutate empty `contactId` (see {@link normalizeStoredTeacher}).
 */
export function stripTeacherWriteNoise(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const next = stripTeacherClientSoftDeleteFields({ ...record }) as Record<string, unknown>;
  return stripRecordFields(next, CONTACT_PROFILE_FIELDS);
}

/**
 * Strips contact-owned profile fields and client soft-delete metadata before persisting a teacher row.
 * Profile keys are always removed (contacts are SSOT) — including when `contactId` is empty/absent.
 */
export function normalizeStoredTeacher<T extends Record<string, unknown>>(record: T): T {
  const next = stripTeacherWriteNoise(record as Record<string, unknown>);
  const contactId = next.contactId;
  if (contactId === '' || contactId == null) {
    delete next.contactId;
  }
  return next as T;
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
