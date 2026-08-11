import {
  hydrateStudentFromContacts,
  resolveStudentGuardianLinks,
  type Contact,
  type Student,
} from '@mms/shared';
import { contactUseCases } from '../../contacts/use-cases/contactUseCases.js';

type ContactWithRelationships = Contact & {
  relationshipContacts?: Array<{ contactId?: string | number; relationship?: string; name?: string }>;
  relationships?: Array<{ contactId?: string | number; relationship?: string; name?: string }>;
};

/**
 * Two-pass hydrate: load primary (+ legacy parent) contacts, derive guardians from
 * Contact relationships, then load any newly discovered guardian contact ids.
 *
 * Contacts are loaded through the contacts composition root (`contactUseCases`),
 * never through raw Drizzle — the same dependency direction the use-case layer
 * uses for every cross-module read.
 */
export async function hydrateStudentsFromContacts(rows: Student[]): Promise<Student[]> {
  if (rows.length === 0) return [];

  const firstPassIds = new Set<string>();
  for (const row of rows) {
    for (const id of [row.contactId, row.fatherContactId, row.motherContactId, row.guardianContactId]) {
      if (id != null && id !== '') firstPassIds.add(String(id));
    }
  }

  let contacts = (
    firstPassIds.size === 0 ? [] : await contactUseCases.loadContactsByIds([...firstPassIds])
  ) as ContactWithRelationships[];
  const contactById = new Map(contacts.map((contact) => [String(contact.id), contact]));

  const withDerived = rows.map((row) => {
    const primary =
      row.contactId != null && row.contactId !== ''
        ? contactById.get(String(row.contactId))
        : undefined;
    const guardians = resolveStudentGuardianLinks(row, primary ?? null);
    return {
      ...row,
      fatherContactId: guardians.fatherContactId,
      motherContactId: guardians.motherContactId,
      guardianContactId: guardians.guardianContactId,
      fatherName: guardians.fatherName,
      motherName: guardians.motherName,
      guardianName: guardians.guardianName,
    } as Student;
  });

  const secondPassIds = new Set<string>();
  for (const row of withDerived) {
    for (const id of [row.fatherContactId, row.motherContactId, row.guardianContactId]) {
      if (id != null && id !== '' && !contactById.has(String(id))) {
        secondPassIds.add(String(id));
      }
    }
  }
  if (secondPassIds.size > 0) {
    const more = (await contactUseCases.loadContactsByIds([...secondPassIds])) as ContactWithRelationships[];
    contacts = [...contacts, ...more];
  }

  return withDerived.map((row) => hydrateStudentFromContacts(row, contacts as never));
}
