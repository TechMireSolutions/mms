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

type DuplicatePrefs = Pick<
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

function pairKey(a: Contact, b: Contact): string {
  return [String(a.id), String(b.id)].sort().join('-');
}

function scorePair(
  phoneMatch: boolean,
  emailMatch: boolean,
  nameMatch: boolean,
  prefs: DuplicatePrefs,
): { confidence: number; reasonKey: ContactDuplicateReasonKey } {
  let confidence = prefs.duplicateDetectionScoreDefault ?? 70;
  let reasonKey: ContactDuplicateReasonKey = 'name';

  if (phoneMatch && emailMatch) {
    confidence = prefs.duplicateDetectionScorePhoneEmail ?? 99;
    reasonKey = 'phoneEmail';
  } else if (phoneMatch) {
    confidence = nameMatch
      ? (prefs.duplicateDetectionScoreNamePhone ?? 95)
      : (prefs.duplicateDetectionScorePhone ?? 80);
    reasonKey = nameMatch ? 'namePhone' : 'phone';
  } else if (emailMatch) {
    confidence = nameMatch
      ? (prefs.duplicateDetectionScoreNameEmail ?? 95)
      : (prefs.duplicateDetectionScoreEmail ?? 80);
    reasonKey = nameMatch ? 'nameEmail' : 'email';
  } else if (nameMatch) {
    confidence = prefs.duplicateDetectionScoreName ?? 75;
    reasonKey = 'name';
  }

  return { confidence, reasonKey };
}

function evaluatePair(c1: Contact, c2: Contact, prefs: DuplicatePrefs): ContactDuplicatePair | null {
  const name1 = cleanName(c1.name || c1.firstName, prefs.namePrefixesToIgnore);
  const name2 = cleanName(c2.name || c2.firstName, prefs.namePrefixesToIgnore);
  const phones1 = getPhoneNumbers(c1);
  const phones2 = getPhoneNumbers(c2);
  const emails1 = getEmails(c1);
  const emails2 = getEmails(c2);

  const phoneMatch =
    phones1.length > 0 && phones2.length > 0 && phones1.some((val) => phones2.includes(val));
  const emailMatch =
    emails1.length > 0 && emails2.length > 0 && emails1.some((val) => emails2.includes(val));
  const nameMatch = Boolean(name1 && name2 && name1 === name2);

  if (!phoneMatch && !emailMatch && !nameMatch) return null;

  const { confidence, reasonKey } = scorePair(phoneMatch, emailMatch, nameMatch, prefs);
  return {
    id: pairKey(c1, c2),
    confidence,
    reasonKey,
    contacts: [c1, c2],
  };
}

/** Finds potential duplicate contact pairs (globle1 §2.2). Indexed scan for large directories. */
export function findContactDuplicatePairs(
  contacts: Contact[],
  prefs: DuplicatePrefs = {},
  options?: { includeDeleted?: boolean },
): ContactDuplicatePair[] {
  const pool = options?.includeDeleted ? contacts : filterActiveContacts(contacts);
  const phoneIndex = new Map<string, Contact[]>();
  const emailIndex = new Map<string, Contact[]>();
  const nameIndex = new Map<string, Contact[]>();

  for (const contact of pool) {
    for (const phone of getPhoneNumbers(contact)) addToIndex(phoneIndex, phone, contact);
    for (const email of getEmails(contact)) addToIndex(emailIndex, email, contact);
    const name = cleanName(contact.name || contact.firstName, prefs.namePrefixesToIgnore);
    if (name) addToIndex(nameIndex, name, contact);
  }

  const matchedPairs = new Set<string>();
  const list: ContactDuplicatePair[] = [];

  for (const c1 of pool) {
    const candidates = new Map<string, Contact>();
    for (const phone of getPhoneNumbers(c1)) {
      for (const c of phoneIndex.get(phone) ?? []) candidates.set(String(c.id), c);
    }
    for (const email of getEmails(c1)) {
      for (const c of emailIndex.get(email) ?? []) candidates.set(String(c.id), c);
    }
    const name = cleanName(c1.name || c1.firstName, prefs.namePrefixesToIgnore);
    if (name) {
      for (const c of nameIndex.get(name) ?? []) candidates.set(String(c.id), c);
    }

    for (const c2 of candidates.values()) {
      if (String(c1.id) === String(c2.id)) continue;
      const key = pairKey(c1, c2);
      if (matchedPairs.has(key)) continue;

      const pair = evaluatePair(c1, c2, prefs);
      if (!pair) continue;

      matchedPairs.add(key);
      list.push(pair);
    }
  }

  return list;
}
