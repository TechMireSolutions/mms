import {
  applyTitleCaseToContact,
  normalizeToE164,
  parsePhoneNumber,
  type Contact,
} from '@mms/shared';
import { fetchCollection, persistCollection } from './dbSyncService.js';
import { contactListSchema } from '../validation/contactSchemas.js';
import { handleContactSaveOrUpdate } from './whatsapp/whatsAppService.js';

const DEFAULT_PHONE_CODE = '+92';

export async function loadContacts(): Promise<Contact[]> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  return parsed.success ? (parsed.data as Contact[]) : [];
}

export function normalizeContactPhones(contact: Contact): Contact {
  if (!contact.phones?.length) {
    return contact;
  }
  return {
    ...contact,
    phones: contact.phones.map((p) => {
      const e164 = normalizeToE164(p.countryCode || DEFAULT_PHONE_CODE, p.number);
      const parsed = parsePhoneNumber(e164, p.countryCode || DEFAULT_PHONE_CODE);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

export function prepareContactRecord(contact: Contact, id?: string | number): Contact {
  const withPhones = normalizeContactPhones(contact);
  const resolvedId = id ?? withPhones.id ?? `temp-${Date.now()}`;
  return applyTitleCaseToContact({ ...withPhones, id: resolvedId }) as Contact;
}

export async function upsertContact(contact: Contact): Promise<{ contact: Contact; created: boolean }> {
  const contactWithId = prepareContactRecord(contact, contact.id);
  const contacts = await loadContacts();
  const index = contacts.findIndex((c) => String(c.id) === String(contactWithId.id));
  const created = index < 0;
  if (created) {
    contacts.push(contactWithId);
  } else {
    contacts[index] = contactWithId;
  }
  await persistCollection('contacts', contacts);
  await handleContactSaveOrUpdate(contactWithId);
  return { contact: contactWithId, created };
}

export async function updateContactById(id: string, contact: Contact): Promise<Contact | null> {
  const contactWithId = prepareContactRecord({ ...contact, id }, id);
  const contacts = await loadContacts();
  const index = contacts.findIndex((c) => String(c.id) === id);
  if (index < 0) {
    return null;
  }
  contacts[index] = contactWithId;
  await persistCollection('contacts', contacts);
  await handleContactSaveOrUpdate(contactWithId);
  return contactWithId;
}

export async function deleteContactById(id: string): Promise<boolean> {
  const contacts = await loadContacts();
  const next = contacts.filter((c) => String(c.id) !== id);
  if (next.length === contacts.length) {
    return false;
  }
  await persistCollection('contacts', next);
  return true;
}
