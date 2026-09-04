import type { Teacher } from './teacherTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import {
  CONTACT_PROFILE_FIELDS,
  createContactLookupMap,
  hydrateContactProfile,
  lookupContact,
  stripRecordFields,
} from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';

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
  // Avatar lives on the canonical Contact — never dual-write it onto a teacher row.
  delete next.avatar;
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

/** Resolves display fields (including the canonical avatar) from the linked contact record. */
export function hydrateTeacherFromContact<T extends Teacher>(
  teacher: T,
  contacts: ContactLike[] | Map<string, ContactLike>,
): T {
  const contactLookup = contacts instanceof Map
    ? contacts
    : (Array.isArray(contacts) && contacts.length > 8 ? createContactLookupMap(contacts) : contacts);
  const hydrated = hydrateContactProfile(teacher as Record<string, unknown>, contactLookup, 'contactId') as T;
  const contactId = String(hydrated.contactId ?? '');
  if (contactId) {
    const contact = lookupContact(contactLookup, contactId);
    if (contact?.avatar && hydrated.avatar !== contact.avatar) {
      return { ...hydrated, avatar: contact.avatar };
    }
  }
  return hydrated;
}

/** Batch hydrates teachers from contacts with O(1) indexed lookup. */
export function hydrateTeacherListFromContacts<T extends Teacher>(
  teachers: T[],
  contacts: ContactLike[] | Map<string, ContactLike>,
): T[] {
  if (!Array.isArray(teachers) || teachers.length === 0) return [];
  const contactLookup = contacts instanceof Map
    ? contacts
    : createContactLookupMap(contacts);
  return teachers.map((teacher) => hydrateTeacherFromContact(teacher, contactLookup));
}
