import type { Contact } from './contactTypes.js';

/** Whether a contact is soft-deleted (globle1 §1.5). */
export function isContactDeleted(contact: Contact): boolean {
  return Boolean(contact.deletedAt);
}

/** Active directory rows — excludes soft-deleted records from Work by default. */
export function filterActiveContacts(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => !isContactDeleted(contact));
}
