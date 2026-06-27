import type { Contact, ContactPreferences } from './contactTypes.js';
import { cleanName, getEmails, getPhoneNumbers } from './utils.js';
import { filterActiveContacts } from './contactSoftDelete.js';

export type ContactDuplicateReasonKey =
  | 'phoneEmail'
  | 'namePhone'
  | 'phone'
  | 'nameEmail'
  | 'email'
  | 'name';

export interface ContactDuplicatePair {
  id: string;
  confidence: number;
  reasonKey: ContactDuplicateReasonKey;
  contacts: [Contact, Contact];
}

type DuplicatePreferences = Pick<
  ContactPreferences,
  | 'namePrefixesToIgnore'
  | 'duplicateDetectionScoreDefault'
  | 'duplicateDetectionScorePhoneEmail'
  | 'duplicateDetectionScoreNamePhone'
  | 'duplicateDetectionScoreNameEmail'
  | 'duplicateDetectionScorePhone'
  | 'duplicateDetectionScoreEmail'
  | 'duplicateDetectionScoreName'
>;

function addToIndex(map: Map<string, Contact[]>, key: string, contact: Contact): void {
  if (!key) return;
  const bucket = map.get(key);
  if (bucket) bucket.push(contact);
  else map.set(key, [contact]);
}

function pairKey(contactA: Contact, contactB: Contact): string {
  return [String(contactA.id), String(contactB.id)].sort().join('-');
}

function scorePair(
  phoneMatch: boolean,
  emailMatch: boolean,
  nameMatch: boolean,
  preferences: DuplicatePreferences,
): { confidence: number; reasonKey: ContactDuplicateReasonKey } {
  let confidence = preferences.duplicateDetectionScoreDefault ?? 70;
  let reasonKey: ContactDuplicateReasonKey = 'name';

  if (phoneMatch && emailMatch) {
    confidence = preferences.duplicateDetectionScorePhoneEmail ?? 99;
    reasonKey = 'phoneEmail';
  } else if (phoneMatch) {
    confidence = nameMatch
      ? (preferences.duplicateDetectionScoreNamePhone ?? 95)
      : (preferences.duplicateDetectionScorePhone ?? 80);
    reasonKey = nameMatch ? 'namePhone' : 'phone';
  } else if (emailMatch) {
    confidence = nameMatch
      ? (preferences.duplicateDetectionScoreNameEmail ?? 95)
      : (preferences.duplicateDetectionScoreEmail ?? 80);
    reasonKey = nameMatch ? 'nameEmail' : 'email';
  } else if (nameMatch) {
    confidence = preferences.duplicateDetectionScoreName ?? 75;
    reasonKey = 'name';
  }

  return { confidence, reasonKey };
}

function evaluatePair(
  contact1: Contact,
  contact2: Contact,
  preferences: DuplicatePreferences,
): ContactDuplicatePair | null {
  const name1 = cleanName(contact1.name || contact1.firstName, preferences.namePrefixesToIgnore);
  const name2 = cleanName(contact2.name || contact2.firstName, preferences.namePrefixesToIgnore);
  const phones1 = getPhoneNumbers(contact1);
  const phones2 = getPhoneNumbers(contact2);
  const emails1 = getEmails(contact1);
  const emails2 = getEmails(contact2);

  const phoneMatch =
    phones1.length > 0 && phones2.length > 0 && phones1.some((value) => phones2.includes(value));
  const emailMatch =
    emails1.length > 0 && emails2.length > 0 && emails1.some((value) => emails2.includes(value));
  const nameMatch = Boolean(name1 && name2 && name1 === name2);

  if (!phoneMatch && !emailMatch && !nameMatch) return null;

  const { confidence, reasonKey } = scorePair(phoneMatch, emailMatch, nameMatch, preferences);
  return {
    id: pairKey(contact1, contact2),
    confidence,
    reasonKey,
    contacts: [contact1, contact2],
  };
}

/** Finds potential duplicate contact pairs (globle1 §2.2). Indexed scan for large directories. */
export function findContactDuplicatePairs(
  contacts: Contact[],
  preferences: DuplicatePreferences = {},
  options?: { includeDeleted?: boolean },
): ContactDuplicatePair[] {
  const pool = options?.includeDeleted ? contacts : filterActiveContacts(contacts);
  const phoneIndex = new Map<string, Contact[]>();
  const emailIndex = new Map<string, Contact[]>();
  const nameIndex = new Map<string, Contact[]>();

  for (const contact of pool) {
    for (const phone of getPhoneNumbers(contact)) addToIndex(phoneIndex, phone, contact);
    for (const email of getEmails(contact)) addToIndex(emailIndex, email, contact);
    const name = cleanName(contact.name || contact.firstName, preferences.namePrefixesToIgnore);
    if (name) addToIndex(nameIndex, name, contact);
  }

  const matchedPairs = new Set<string>();
  const list: ContactDuplicatePair[] = [];

  for (const contact1 of pool) {
    const candidates = new Map<string, Contact>();
    for (const phone of getPhoneNumbers(contact1)) {
      for (const contact of phoneIndex.get(phone) ?? []) candidates.set(String(contact.id), contact);
    }
    for (const email of getEmails(contact1)) {
      for (const contact of emailIndex.get(email) ?? []) candidates.set(String(contact.id), contact);
    }
    const name = cleanName(contact1.name || contact1.firstName, preferences.namePrefixesToIgnore);
    if (name) {
      for (const contact of nameIndex.get(name) ?? []) candidates.set(String(contact.id), contact);
    }

    for (const contact2 of candidates.values()) {
      if (String(contact1.id) === String(contact2.id)) continue;
      const key = pairKey(contact1, contact2);
      if (matchedPairs.has(key)) continue;

      const pair = evaluatePair(contact1, contact2, preferences);
      if (!pair) continue;

      matchedPairs.add(key);
      list.push(pair);
    }
  }

  return list;
}
