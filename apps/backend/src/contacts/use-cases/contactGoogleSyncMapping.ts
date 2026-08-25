import type { Address, Contact, EmailAddress, PhoneNumber } from '@mms/shared';
import { normalizeToE164, parsePhoneNumber } from '@mms/shared';
import type { ContactRuntimeDefaults } from './contactLoadUseCases.js';

export interface GoogleConnection {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }>;
  biographies?: Array<{ value?: string }>;
  addresses?: Array<{ streetAddress?: string; city?: string; region?: string; country?: string }>;
}

export function mapGoogleConnectionToContact(person: GoogleConnection, defaults: ContactRuntimeDefaults): Contact | null {
  const nameObj = person.names?.[0];
  const name = nameObj?.displayName || '';
  if (!name) return null;

  const phones: PhoneNumber[] = [];
  const seenPhoneDigits = new Set<string>();
  for (const phoneItem of person.phoneNumbers || []) {
    const raw = (phoneItem.value || '').trim();
    if (!raw) continue;
    const parsedRaw = parsePhoneNumber(raw, defaults.defaultPhoneCountryCode);
    const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
    const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);
    const digits = `${parsed.countryCode}${parsed.number}`.replace(/\D/g, '');
    if (digits && !seenPhoneDigits.has(digits)) {
      seenPhoneDigits.add(digits);
      phones.push({
        label: defaults.phoneLabel,
        countryCode: parsed.countryCode,
        number: parsed.number,
      });
    }
  }

  const emails: EmailAddress[] = [];
  const seenEmails = new Set<string>();
  for (const emailItem of person.emailAddresses || []) {
    const raw = (emailItem.value || '').trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (!seenEmails.has(lower)) {
      seenEmails.add(lower);
      emails.push({
        label: defaults.emailLabel,
        address: raw,
      });
    }
  }

  const addresses: Address[] = [];
  for (const addr of person.addresses || []) {
    if (addr.streetAddress || addr.city || addr.region || addr.country) {
      addresses.push({
        line1: addr.streetAddress || '',
        city: addr.city || '',
        state: addr.region || '',
        country: addr.country || '',
      });
    }
  }

  const org = person.organizations?.[0]?.name || '';
  const title = person.organizations?.[0]?.title || '';
  const bday = person.birthdays?.[0]?.date;
  const note = (person.biographies || [])
    .map((b) => b.value?.trim())
    .filter(Boolean)
    .join('\n\n');

  const contact: Contact = {
    id: crypto.randomUUID(),
    name,
    firstName: nameObj?.givenName || name.split(' ')[0],
    lastName: nameObj?.familyName || name.split(' ').slice(1).join(' '),
    phones,
    emails,
    employer: org,
    designation: title,
    notes: note,
    addresses,
    socials: [],
    relationshipContacts: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (bday?.year && bday?.month && bday?.day) {
    contact.dob = `${bday.year}-${String(bday.month).padStart(2, '0')}-${String(bday.day).padStart(2, '0')}`;
  }

  return contact;
}

export function extractPhoneKeys(contact: Contact): string[] {
  const keys = new Set<string>();
  for (const phone of contact.phones ?? []) {
    const raw = String(phone.number || '').trim();
    if (!raw) continue;
    const digits = raw.replace(/\D/g, '');
    const cc = String(phone.countryCode || '').replace(/\D/g, '');
    const withCountry = `${cc}${digits}`;
    if (digits) keys.add(digits);
    if (withCountry) keys.add(withCountry);
    if (digits.length >= 10) keys.add(digits.slice(-10));
    if (withCountry.length >= 10) keys.add(withCountry.slice(-10));
  }
  return [...keys];
}

export function extractEmails(contact: Contact): string[] {
  const emails = new Set<string>();
  for (const email of contact.emails ?? []) {
    const raw = String(email.address || '').trim().toLowerCase();
    if (raw) emails.add(raw);
  }
  return [...emails];
}

export function findMatchingPeer(candidate: Contact, peers: Contact[]): Contact | undefined {
  const candidatePhones = new Set(extractPhoneKeys(candidate));
  const candidateEmails = new Set(extractEmails(candidate));
  const candidateName = candidate.name.trim().toLowerCase();

  for (const peer of peers) {
    for (const key of extractPhoneKeys(peer)) {
      if (candidatePhones.has(key)) return peer;
    }
    for (const email of extractEmails(peer)) {
      if (candidateEmails.has(email)) return peer;
    }
    if (candidateName && peer.name.trim().toLowerCase() === candidateName) {
      return peer;
    }
  }
  return undefined;
}

export function hasMeaningfulChanges(original: Contact, merged: Contact): boolean {
  const phonesChanged = (merged.phones?.length ?? 0) !== (original.phones?.length ?? 0);
  const emailsChanged = (merged.emails?.length ?? 0) !== (original.emails?.length ?? 0);
  const addressesChanged = (merged.addresses?.length ?? 0) !== (original.addresses?.length ?? 0);
  const notesChanged = (merged.notes || '') !== (original.notes || '');
  const employerChanged = (merged.employer || '') !== (original.employer || '');
  const designationChanged = (merged.designation || '') !== (original.designation || '');
  const dobChanged = (merged.dob || '') !== (original.dob || '');

  return (
    phonesChanged ||
    emailsChanged ||
    addressesChanged ||
    notesChanged ||
    employerChanged ||
    designationChanged ||
    dobChanged
  );
}
