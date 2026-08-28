import {
  hydrateContactProfile,
  hydrateParentContactNames,
  normalizeContactLinkedRecord,
  stripRecordFields,
  type ContactLike,
} from './contactLinkPolicy.js';
import { stripContactClientSoftDeleteFields } from './contactSoftDelete.js';
import {
  resolveStudentGuardianLinks,
  type ContactWithRelationships,
} from './studentGuardianFromContacts.js';
import type { Student } from './studentTypes.js';

export const STUDENT_GUARDIAN_LINK_FIELDS = [
  'fatherContactId',
  'motherContactId',
  'guardianContactId',
  'fatherName',
  'motherName',
  'guardianName',
] as const;

/** Strip client soft-delete metadata from student create/update payloads. */
export function stripStudentClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = stripContactClientSoftDeleteFields(record) as Record<string, unknown>;
  delete next.deleted;
  return next as T;
}

function stripStudentGuardianLinkFields<T extends Record<string, unknown>>(record: T): T {
  return stripRecordFields(record, STUDENT_GUARDIAN_LINK_FIELDS);
}

/** Strips contact-owned fields and client soft-delete metadata before persisting a student row. */
export function normalizeStoredStudent<T extends Record<string, unknown>>(record: T): T {
  let normalizedStudent = stripStudentClientSoftDeleteFields(record);
  normalizedStudent = normalizeContactLinkedRecord(normalizedStudent);
  // Guardians live on the primary contact's relationship graph — do not dual-write ids/names.
  return stripStudentGuardianLinkFields(normalizedStudent);
}

export type { ContactWithRelationships };

/** Hydrates student + parent display fields from contacts (relationships preferred). */
export function hydrateStudentFromContacts<T extends Student>(
  student: T,
  contacts: (ContactLike | ContactWithRelationships)[],
): T {
  const primary = contacts.find((contact) => String(contact.id) === String(student.contactId));
  const guardians = resolveStudentGuardianLinks(student, (primary as ContactWithRelationships) ?? null);
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
    hydrateContactProfile(withGuardians, contacts as ContactLike[]),
    contacts as ContactLike[],
  ) as T;
}

export interface StudentNameParentLabels {
  father?: string;
  mother?: string;
  guardian?: string;
  separator?: string;
}

/**
 * Composes a student display title including father and mother names.
 * Format: "Student Name (Father: Father Name, Mother: Mother Name)" or fallback variants.
 *
 * @param student - Student object or partial shape containing name and parentage
 * @param labels - Optional localized labels for Father, Mother, Guardian, and separator
 * @returns Composed display name string
 */
export function formatStudentNameWithParents(
  student?: {
    name?: string | null;
    fatherName?: string | null;
    motherName?: string | null;
    guardianName?: string | null;
  } | null,
  labels?: StudentNameParentLabels,
): string {
  if (!student) return '';

  const name = (student.name || '').trim();
  const father = (student.fatherName || '').trim();
  const mother = (student.motherName || '').trim();
  const guardian = (student.guardianName || '').trim();

  const fatherLabel = labels?.father || 'Father';
  const motherLabel = labels?.mother || 'Mother';
  const guardianLabel = labels?.guardian || 'Guardian';
  const separator = labels?.separator ?? ', ';

  const parts: string[] = [];
  if (father) {
    parts.push(`${fatherLabel}: ${father}`);
  }
  if (mother) {
    parts.push(`${motherLabel}: ${mother}`);
  }
  if (!father && !mother && guardian) {
    parts.push(`${guardianLabel}: ${guardian}`);
  }

  if (parts.length === 0) {
    return name;
  }

  return name ? `${name} (${parts.join(separator)})` : `(${parts.join(separator)})`;
}
