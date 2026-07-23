import type { Contact } from './contactTypes.js';
import { getPrimaryEmail, getPrimaryPhone } from './utils.js';

/** Normalizes a string for search comparison by stripping diacritics/accents and standardizing common Arabic/Urdu/Persian letters. */
export function normalizeSearchString(val: string): string {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove English/Latin diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic/Urdu short vowels (harakat/tashkeel/diacritics)
    .replace(/ي/g, 'ی') // normalize Arabic Yeh to Farsi/Urdu Yeh
    .replace(/ك/g, 'ک') // normalize Arabic Kaf to Persian/Urdu Kaf
    .toLowerCase();
}

/** Approved Work-tab search haystack (globle1 §3.2). */
export function getContactSearchHaystack(contact: Contact): string {
  const parts: Array<string | null | undefined> = [
    contact.name,
    contact.firstName,
    contact.lastName,
    getPrimaryPhone(contact),
    getPrimaryEmail(contact),
    (contact.city as string) || '',
    ...((contact.emails || []).map((email) => email.address)),
    ...((contact.addresses || []).map((address) => [address.city, address.state, address.country, address.line1].filter(Boolean).join(' '))),
  ];
  return normalizeSearchString(parts.filter((part): part is string => Boolean(part)).join(' '));
}

export function contactMatchesSearch(contact: Contact, query: string): boolean {
  const normalizedQuery = normalizeSearchString(query.trim());
  if (!normalizedQuery) return true;
  return getContactSearchHaystack(contact).includes(normalizedQuery);
}
