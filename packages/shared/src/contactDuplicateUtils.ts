import {
  COLOR_PALETTES,
  DEFAULT_CONTACT_PREFERENCES,
  type Contact,
  type ContactPreferences,
} from './contactTypes.js';
import { cleanName, getEmails, getPhoneNumbers } from './utils.js';
import { filterActiveContacts } from './contactSoftDelete.js';

export type ContactDuplicateReasonKey =
  | 'cnic'
  | 'cnicName'
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

const DEFAULT_DUPLICATE_SCORES = {
  default: 70,
  cnic: 99,
  cnicName: 100,
  phoneEmail: 99,
  namePhone: 95,
  phone: 80,
  nameEmail: 95,
  email: 80,
  name: 75,
} as const;

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

function getContactCleanName(contact: Contact, namePrefixesToIgnore?: string[]): string {
  return cleanName(contact.name || contact.firstName, namePrefixesToIgnore);
}

function getContactCleanCnic(contact: Contact): string {
  if (!contact.cnic) return '';
  const digits = contact.cnic.replace(/\D/g, '');
  return digits.length === 13 ? digits : '';
}

/**
 * Normalized duplicate keys (phones / emails / name / cnic) for a contact.
 *
 * Single source shared by JS pair-finding (`findContactDuplicatePairs`) and the
 * backend's SQL blocking queries, so the key space can never drift.
 */
export function getContactDuplicateCandidateKeys(
  contact: Contact,
  preferences: DuplicatePreferences = {},
): { phones: string[]; emails: string[]; name: string; cnic: string } {
  return {
    phones: getPhoneNumbers(contact),
    emails: getEmails(contact),
    name: getContactCleanName(contact, preferences.namePrefixesToIgnore),
    cnic: getContactCleanCnic(contact),
  };
}

function hasOverlap(listA: string[], listB: string[]): boolean {
  if (listA.length === 0 || listB.length === 0) return false;
  return listA.some((val) => listB.includes(val));
}

function scorePair(
  phoneMatch: boolean,
  emailMatch: boolean,
  nameMatch: boolean,
  cnicMatch: boolean,
  preferences: DuplicatePreferences,
): { confidence: number; reasonKey: ContactDuplicateReasonKey } {
  let confidence = preferences.duplicateDetectionScoreDefault ?? DEFAULT_DUPLICATE_SCORES.default;
  let reasonKey: ContactDuplicateReasonKey = 'name';

  if (cnicMatch) {
    confidence = nameMatch ? DEFAULT_DUPLICATE_SCORES.cnicName : DEFAULT_DUPLICATE_SCORES.cnic;
    reasonKey = nameMatch ? 'cnicName' : 'cnic';
  } else if (phoneMatch && emailMatch) {
    confidence = preferences.duplicateDetectionScorePhoneEmail ?? DEFAULT_DUPLICATE_SCORES.phoneEmail;
    reasonKey = 'phoneEmail';
  } else if (phoneMatch) {
    confidence = nameMatch
      ? (preferences.duplicateDetectionScoreNamePhone ?? DEFAULT_DUPLICATE_SCORES.namePhone)
      : (preferences.duplicateDetectionScorePhone ?? DEFAULT_DUPLICATE_SCORES.phone);
    reasonKey = nameMatch ? 'namePhone' : 'phone';
  } else if (emailMatch) {
    confidence = nameMatch
      ? (preferences.duplicateDetectionScoreNameEmail ?? DEFAULT_DUPLICATE_SCORES.nameEmail)
      : (preferences.duplicateDetectionScoreEmail ?? DEFAULT_DUPLICATE_SCORES.email);
    reasonKey = nameMatch ? 'nameEmail' : 'email';
  } else if (nameMatch) {
    confidence = preferences.duplicateDetectionScoreName ?? DEFAULT_DUPLICATE_SCORES.name;
    reasonKey = 'name';
  }

  return { confidence, reasonKey };
}

function evaluatePair(
  contact1: Contact,
  contact2: Contact,
  preferences: DuplicatePreferences,
): ContactDuplicatePair | null {
  const name1 = getContactCleanName(contact1, preferences.namePrefixesToIgnore);
  const name2 = getContactCleanName(contact2, preferences.namePrefixesToIgnore);
  const phones1 = getPhoneNumbers(contact1);
  const phones2 = getPhoneNumbers(contact2);
  const emails1 = getEmails(contact1);
  const emails2 = getEmails(contact2);
  const cnic1 = getContactCleanCnic(contact1);
  const cnic2 = getContactCleanCnic(contact2);

  const phoneMatch = hasOverlap(phones1, phones2);
  const emailMatch = hasOverlap(emails1, emails2);
  const nameMatch = Boolean(name1 && name2 && name1 === name2);
  const cnicMatch = Boolean(cnic1 && cnic2 && cnic1 === cnic2);

  if (!phoneMatch && !emailMatch && !nameMatch && !cnicMatch) return null;

  const { confidence, reasonKey } = scorePair(
    phoneMatch,
    emailMatch,
    nameMatch,
    cnicMatch,
    preferences,
  );
  return {
    id: pairKey(contact1, contact2),
    confidence,
    reasonKey,
    contacts: [contact1, contact2],
  };
}

function collectCandidatesFromKeys(
  indexMap: Map<string, Contact[]>,
  keys: string[],
  targetCandidates: Map<string, Contact>,
): void {
  for (const key of keys) {
    if (!key) continue;
    const matches = indexMap.get(key);
    if (matches) {
      for (const match of matches) {
        targetCandidates.set(String(match.id), match);
      }
    }
  }
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
  const cnicIndex = new Map<string, Contact[]>();

  for (const contact of pool) {
    const keys = getContactDuplicateCandidateKeys(contact, preferences);
    for (const phone of keys.phones) addToIndex(phoneIndex, phone, contact);
    for (const email of keys.emails) addToIndex(emailIndex, email, contact);
    if (keys.name) addToIndex(nameIndex, keys.name, contact);
    if (keys.cnic) addToIndex(cnicIndex, keys.cnic, contact);
  }

  const matchedPairs = new Set<string>();
  const list: ContactDuplicatePair[] = [];

  for (const contact1 of pool) {
    const keys = getContactDuplicateCandidateKeys(contact1, preferences);
    const candidates = new Map<string, Contact>();
    collectCandidatesFromKeys(phoneIndex, keys.phones, candidates);
    collectCandidatesFromKeys(emailIndex, keys.emails, candidates);
    if (keys.name) {
      collectCandidatesFromKeys(nameIndex, [keys.name], candidates);
    }
    if (keys.cnic) {
      collectCandidatesFromKeys(cnicIndex, [keys.cnic], candidates);
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

/** Resolves badge styling and tier classification for duplicate match confidence scores. */
export function getDuplicateConfidenceBadgeStyle(
  score: number,
  prefs?: Partial<ContactPreferences>,
): { colorClass: string; labelTier: 'high' | 'medium' | 'low' } {
  const highThreshold = prefs?.duplicateDetectionThresholdHigh ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionThresholdHigh!;
  const medThreshold = prefs?.duplicateDetectionThresholdMedium ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionThresholdMedium!;
  const highColor = prefs?.duplicateDetectionColorHigh ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorHigh ?? COLOR_PALETTES.red.bg;
  const medColor = prefs?.duplicateDetectionColorMedium ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorMedium ?? COLOR_PALETTES.amber.bg;
  const lowColor = prefs?.duplicateDetectionColorLow ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorLow ?? COLOR_PALETTES.slate.bg;

  if (score >= highThreshold) {
    return { colorClass: highColor, labelTier: 'high' };
  }
  if (score >= medThreshold) {
    return { colorClass: medColor, labelTier: 'medium' };
  }
  return { colorClass: lowColor, labelTier: 'low' };
}


