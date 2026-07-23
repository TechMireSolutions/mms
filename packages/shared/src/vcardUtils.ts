import type { Contact } from './contactTypes.js';
import { normalizeToE164, parsePhoneNumber } from './utils.js';
import { todayISO } from './utils.js';

/**
 * Options for parsing a vCard text block into Contact records.
 */
export interface ParseVCardOptions {
  /** Label for generated mobile phone entries (default: 'Mobile'). */
  mobileLabel?: string;
  /** Label for generated email entries (default: 'Personal'). */
  personalLabel?: string;
  /** Default phone country code for E.164 parsing (default: '+92'). */
  defaultPhoneCountryCode?: string;
}

/**
 * Parses a raw vCard (.vcf) formatted string into an array of normalized Contact objects.
 *
 * @param text - The raw vCard content string.
 * @param options - Optional label and country code configuration.
 * @returns Array of parsed Contact objects.
 */
export function parseVCard(text: string, options?: ParseVCardOptions): Contact[] {
  const mobileLabel = options?.mobileLabel || 'Mobile';
  const personalLabel = options?.personalLabel || 'Personal';
  const defaultPhoneCountryCode = options?.defaultPhoneCountryCode || '+92';

  const contacts: Contact[] = [];
  const cards = text.split(/BEGIN:VCARD/i).filter((cardText) => cardText.trim());

  for (const card of cards) {
    const get = (key: string): string => {
      const re = new RegExp(`^${key}[^:]*:(.*)$`, 'im');
      const match = card.match(re);
      return match ? match[1].trim() : '';
    };

    const name = get('FN');
    if (!name) continue;

    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    const phone = (card.match(/^TEL[^:]*:(.+)$/im) || [])[1]?.trim() || '';
    const parsedRaw = parsePhoneNumber(phone, defaultPhoneCountryCode);
    const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
    const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);

    const email = (card.match(/^EMAIL[^:]*:(.+)$/im) || [])[1]?.trim() || '';
    const org = get('ORG').split(';')[0];
    const title = get('TITLE');
    const note = get('NOTE');
    const bday = get('BDAY');

    const contact: Contact = {
      id: Date.now() + Math.random(),
      name,
      firstName,
      lastName,
      phones: phone ? [{ label: mobileLabel, countryCode: parsed.countryCode, number: parsed.number }] : [],
      emails: email ? [{ label: personalLabel, address: email }] : [],
      employer: org || '',
      designation: title || '',
      notes: note || '',
      addresses: [],
      socials: [],
      emergencyContacts: [],
      createdAt: todayISO(),
    };

    if (bday) {
      const clean = bday.replace(/[^0-9]/g, '');
      if (clean.length === 8) {
        contact.dob = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
      }
    }

    contacts.push(contact);
  }

  return contacts;
}

/**
 * Converts a Contact object into a standard vCard 3.0 (.vcf) formatted string.
 *
 * @param contact - The contact object to convert.
 * @returns The formatted vCard string.
 */
export function toVCard(contact: Contact): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name || ''}`,
    `N:${contact.lastName || ''};${contact.firstName || ''};;;`,
  ];

  (contact.phones || []).forEach((phoneEntry) =>
    lines.push(`TEL;TYPE=${phoneEntry.label?.toUpperCase() || 'CELL'}:${phoneEntry.number}`),
  );
  (contact.emails || []).forEach((emailEntry) =>
    lines.push(`EMAIL;TYPE=${emailEntry.label?.toUpperCase() || 'INTERNET'}:${emailEntry.address}`),
  );
  if (contact.employer) lines.push(`ORG:${contact.employer}`);
  if (contact.designation) lines.push(`TITLE:${contact.designation}`);
  if (contact.notes) lines.push(`NOTE:${contact.notes}`);
  if (contact.dob) lines.push(`BDAY:${contact.dob.replace(/-/g, '')}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}
