import type { Contact } from './contactTypes.js';

/** Soft-delete metadata must only be set by dedicated soft-delete helpers. */
export const CONTACT_CLIENT_SOFT_DELETE_KEYS = ['deletedAt', 'deletedBy', 'deletionReason'] as const;

/** Whether a contact is soft-deleted (globle1 §1.5). */
export function isContactDeleted(contact: Contact): boolean {
  return Boolean(contact.deletedAt);
}

/** Active directory rows — excludes soft-deleted records from Work by default. */
export function filterActiveContacts(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => !isContactDeleted(contact));
}

/** Strip client-supplied soft-delete fields from a contact write payload. */
export function stripContactClientSoftDeleteFields<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record };
  for (const key of CONTACT_CLIENT_SOFT_DELETE_KEYS) {
    delete next[key];
  }
  return next;
}
