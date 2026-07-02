/**
 * Contact-first person policy: identity fields live on `contacts` only.
 * Module records store `contactId` (or chain via studentId / teacherId) and hydrate display fields on read.
 */

/** Profile fields owned by the contacts collection — never persist on linked module rows. */
export const CONTACT_PROFILE_FIELDS = [
  'name',
  'phone',
  'email',
  'gender',
  'dob',
  'city',
  'firstName',
  'lastName',
] as const;

export interface ContactLike {
  id: string | number;
  name?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  city?: string;
  phones?: { number?: string }[];
  emails?: { address?: string }[];
}

export function stripRecordFields<T extends Record<string, unknown>>(
  record: T,
  fields: readonly string[],
): T {
  const strippedRecord = { ...record };
  for (const field of fields) {
    delete strippedRecord[field];
  }
  return strippedRecord;
}

/** Removes contact-owned profile fields when a contact link is present. */
export function normalizeContactLinkedRecord<T extends Record<string, unknown>>(
  record: T,
  contactIdField = 'contactId',
): T {
  const contactId = record[contactIdField];
  if (contactId == null || contactId === '') return record;
  return stripRecordFields(record, CONTACT_PROFILE_FIELDS);
}

/** Removes parent name copies when parent contact links exist. */
export function normalizeParentContactLinks<T extends Record<string, unknown>>(record: T): T {
  let normalizedRecord = { ...record };
  if (normalizedRecord.fatherContactId != null && normalizedRecord.fatherContactId !== '') {
    normalizedRecord = stripRecordFields(normalizedRecord, ['fatherName']);
  }
  if (normalizedRecord.motherContactId != null && normalizedRecord.motherContactId !== '') {
    normalizedRecord = stripRecordFields(normalizedRecord, ['motherName']);
  }
  if (normalizedRecord.guardianContactId != null && normalizedRecord.guardianContactId !== '') {
    normalizedRecord = stripRecordFields(normalizedRecord, ['guardianName']);
  }
  return normalizedRecord;
}

/** Removes a denormalized display name when the canonical id field is set. */
export function normalizeIdLinkedName<T extends Record<string, unknown>>(
  record: T,
  idField: string,
  nameField: string,
): T {
  const id = record[idField];
  if (id == null || id === '') return record;
  return stripRecordFields(record, [nameField]);
}

export function hydrateContactProfile<T extends Record<string, unknown>>(
  record: T,
  contacts: ContactLike[],
  contactIdField = 'contactId',
): T {
  const contactId = record[contactIdField];
  if (contactId == null || contactId === '') return record;
  const contact = contacts.find((candidateContact) => String(candidateContact.id) === String(contactId));
  if (!contact) return record;
  return {
    ...record,
    name: contact.name ?? record.name,
    gender: contact.gender ?? record.gender,
    dob: contact.dob ?? record.dob,
    phone: contact.phone ?? contact.phones?.[0]?.number ?? record.phone,
    email: contact.email ?? contact.emails?.[0]?.address ?? record.email,
    city: contact.city ?? record.city,
  };
}

export function hydrateParentContactNames<T extends Record<string, unknown>>(
  record: T,
  contacts: ContactLike[],
): T {
  let hydratedRecord = { ...record };
  if (record.fatherContactId != null && record.fatherContactId !== '') {
    const contact = contacts.find((candidateContact) => String(candidateContact.id) === String(record.fatherContactId));
    if (contact?.name) hydratedRecord = { ...hydratedRecord, fatherName: contact.name };
  }
  if (record.motherContactId != null && record.motherContactId !== '') {
    const contact = contacts.find((candidateContact) => String(candidateContact.id) === String(record.motherContactId));
    if (contact?.name) hydratedRecord = { ...hydratedRecord, motherName: contact.name };
  }
  if (record.guardianContactId != null && record.guardianContactId !== '') {
    const contact = contacts.find((candidateContact) => String(candidateContact.id) === String(record.guardianContactId));
    if (contact?.name) hydratedRecord = { ...hydratedRecord, guardianName: contact.name };
  }
  return hydratedRecord;
}

export interface NamedEntity {
  id: string | number;
  name?: string;
}

export function resolveEntityName(
  id: string | number | null | undefined,
  entities: NamedEntity[],
): string {
  if (id == null || id === '') return '';
  return entities.find((entity) => String(entity.id) === String(id))?.name ?? '';
}
