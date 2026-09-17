import type { Teacher } from './facultyTypes.js';
import type { ContactLike } from './contactLinkPolicy.js';
import {
  CONTACT_PROFILE_FIELDS,
  createContactLookupMap,
  hydrateContactProfile,
  lookupContact,
  stripRecordFields,
} from './contactLinkPolicy.js';
export {
  TEACHER_CLIENT_SOFT_DELETE_KEYS,
  stripTeacherClientSoftDeleteFields,
  FACULTY_CLIENT_SOFT_DELETE_KEYS,
  stripFacultyClientSoftDeleteFields,
  stripClientSoftDeleteFields,
  isEntityDeleted,
  filterActiveEntities,
  isTeacherDeleted,
  filterActiveTeachers,
  isFacultyDeleted,
  filterActiveFaculty,
} from './facultySoftDelete.js';

import { stripTeacherClientSoftDeleteFields } from './facultySoftDelete.js';

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

/**
 * Resolves the academic or teaching qualification degrees from a linked contact record.
 * Inspects `contact.education` degrees first, falling back to scalar qualification if present.
 */
export function getContactQualification(contact?: ContactLike | null): string {
  if (!contact) return '';
  if (Array.isArray(contact.education) && contact.education.length > 0) {
    const degrees = contact.education
      .map((edu) => (typeof edu?.degree === 'string' ? edu.degree.trim() : ''))
      .filter(Boolean);
    if (degrees.length > 0) {
      return Array.from(new Set(degrees)).join(', ');
    }
  }
  if (typeof (contact as Record<string, unknown>).qualification === 'string') {
    return ((contact as Record<string, unknown>).qualification as string).trim();
  }
  return '';
}

/**
 * Resolves teaching subject specialization from a linked contact record.
 * Inspects `contact.education` fieldOfStudy, `contact.skills` names, or scalar specialization.
 */
export function getContactSpecialization(contact?: ContactLike | null): string {
  if (!contact) return '';
  if (Array.isArray(contact.education) && contact.education.length > 0) {
    const fields = contact.education
      .map((edu) => (typeof edu?.fieldOfStudy === 'string' ? edu.fieldOfStudy.trim() : ''))
      .filter(Boolean);
    if (fields.length > 0) {
      return Array.from(new Set(fields)).join(', ');
    }
  }
  if (Array.isArray(contact.skills) && contact.skills.length > 0) {
    const skillNames = contact.skills
      .map((skill) => (typeof skill?.name === 'string' ? skill.name.trim() : ''))
      .filter(Boolean);
    if (skillNames.length > 0) {
      return Array.from(new Set(skillNames)).join(', ');
    }
  }
  if (typeof (contact as Record<string, unknown>).specialization === 'string') {
    return ((contact as Record<string, unknown>).specialization as string).trim();
  }
  return '';
}

/** Resolves display fields (including the canonical avatar, qualification, and specialization) from the linked contact record. */
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
    if (contact) {
      if (contact.avatar && hydrated.avatar !== contact.avatar) {
        hydrated.avatar = contact.avatar;
      }
      const qualification = getContactQualification(contact);
      if (qualification) {
        hydrated.qualification = qualification;
      }
      const specialization = getContactSpecialization(contact);
      if (specialization) {
        hydrated.specialization = specialization;
      }
    }
  }
  return hydrated;
}

/** Formats a teacher's display name, appending the employee ID when available. */
export function formatTeacherDisplayName(teacher?: Partial<Teacher> | null): string {
  if (!teacher) return '';
  const name = (teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')).trim();
  if (name) {
    return teacher.employeeId ? `${name} (${teacher.employeeId})` : name;
  }
  if (teacher.employeeId) {
    return `Teacher (${teacher.employeeId})`;
  }
  return teacher.id ? `Teacher #${String(teacher.id).slice(0, 8)}` : '';
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


export const getFacultyQualification = getContactQualification;
export const getFacultySpecialization = getContactSpecialization;
export const stripFacultyWriteNoise = stripTeacherWriteNoise;
export const normalizeStoredFaculty = normalizeStoredTeacher;
export const hydrateFacultyFromContact = hydrateTeacherFromContact;
export const formatFacultyDisplayName = formatTeacherDisplayName;
export const hydrateFacultyListFromContacts = hydrateTeacherListFromContacts;
