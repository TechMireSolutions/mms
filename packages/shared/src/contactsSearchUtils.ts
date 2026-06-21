import type { Contact } from './contactTypes.js';
import { getPrimaryEmail, getPrimaryPhone } from './utils.js';

/** Approved Work-tab search haystack (globle1 §3.2). */
export function getContactSearchHaystack(contact: Contact): string {
  const parts: Array<string | null | undefined> = [
    contact.name,
    contact.firstName,
    contact.lastName,
    getPrimaryPhone(contact),
    getPrimaryEmail(contact),
    (contact.city as string) || '',
    ...((contact.emails || []).map((e) => e.address)),
    ...((contact.addresses || []).map((a) => [a.city, a.state, a.country, a.line1].filter(Boolean).join(' '))),
  ];
  return parts.filter((part): part is string => Boolean(part)).join(' ').toLowerCase();
}

export function contactMatchesSearch(contact: Contact, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return getContactSearchHaystack(contact).includes(q);
}
