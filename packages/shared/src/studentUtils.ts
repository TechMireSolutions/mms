import type { ContactLike } from './contactLinkPolicy.js';
import {
  hydrateContactProfile,
  hydrateParentContactNames,
  normalizeContactLinkedRecord,
} from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import { resolveStudentGuardianLinks } from './studentGuardianFromContacts.js';
import type { Student } from './studentTypes.js';
import type { ContactRelationship, RelationshipContact } from './contactEntityTypes.js';

/** Strip client soft-delete metadata from student create/update payloads. */
export function stripStudentClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = stripContactClientSoftDeleteFields(record) as Record<string, unknown>;
  delete next.deleted;
  return next as T;
}

function stripStudentGuardianLinkFields<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record };
  delete next.fatherContactId;
  delete next.motherContactId;
  delete next.guardianContactId;
  delete next.fatherName;
  delete next.motherName;
  delete next.guardianName;
  return next;
}

/** Strips contact-owned fields and client soft-delete metadata before persisting a student row. */
export function normalizeStoredStudent<T extends Record<string, unknown>>(record: T): T {
  let normalizedStudent = stripStudentClientSoftDeleteFields(record);
  normalizedStudent = normalizeContactLinkedRecord(normalizedStudent);
  // Guardians live on the primary contact's relationship graph — do not dual-write ids/names.
  return stripStudentGuardianLinkFields(normalizedStudent);
}

type ContactWithRelationships = ContactLike & {
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
};

/** Hydrates student + parent display fields from contacts (relationships preferred). */
export function hydrateStudentFromContacts<T extends Student>(
  student: T,
  contacts: ContactWithRelationships[],
): T {
  const primary = contacts.find((contact) => String(contact.id) === String(student.contactId));
  const guardians = resolveStudentGuardianLinks(student, primary ?? null);
  const withGuardians = {
    ...student,
    fatherContactId: guardians.fatherContactId,
    motherContactId: guardians.motherContactId,
    guardianContactId: guardians.guardianContactId,
    fatherName: guardians.fatherName,
    motherName: guardians.motherName,
    guardianName: guardians.guardianName,
  } as T;

  return hydrateParentContactNames(
    hydrateContactProfile(withGuardians, contacts),
    contacts,
  ) as T;
}
