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
  const next = { ...record };
  for (const field of fields) {
    delete next[field];
  }
  return next;
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
  let next = { ...record };
  if (next.fatherContactId != null && next.fatherContactId !== '') {
    next = stripRecordFields(next, ['fatherName']);
  }
  if (next.motherContactId != null && next.motherContactId !== '') {
    next = stripRecordFields(next, ['motherName']);
  }
  if (next.guardianContactId != null && next.guardianContactId !== '') {
    next = stripRecordFields(next, ['guardianName']);
  }
  return next;
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
  const contact = contacts.find((c) => String(c.id) === String(contactId));
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
  let next = { ...record };
  if (record.fatherContactId != null && record.fatherContactId !== '') {
    const contact = contacts.find((c) => String(c.id) === String(record.fatherContactId));
    if (contact?.name) next = { ...next, fatherName: contact.name };
  }
  if (record.motherContactId != null && record.motherContactId !== '') {
    const contact = contacts.find((c) => String(c.id) === String(record.motherContactId));
    if (contact?.name) next = { ...next, motherName: contact.name };
  }
  if (record.guardianContactId != null && record.guardianContactId !== '') {
    const contact = contacts.find((c) => String(c.id) === String(record.guardianContactId));
    if (contact?.name) next = { ...next, guardianName: contact.name };
  }
  return next;
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
