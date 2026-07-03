import type { Contact } from './contactTypes.js';
import { contactMatchesSearch } from './contactsSearchUtils.js';
import { filterActiveContacts, isContactDeleted } from './contactSoftDelete.js';

export interface ContactsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  hasPhone?: boolean;
}

export interface ContactsListPageResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function filterContactsForQuery(contacts: Contact[], query: ContactsListQuery): Contact[] {
  let rows = query.includeDeleted ? contacts : filterActiveContacts(contacts);
  if (query.gender) {
    rows = rows.filter((contact) => contact.gender === query.gender);
  }
  if (query.hasPhone) {
    rows = rows.filter((contact) => {
      const contactPhone = contact.phone || contact.phones?.[0]?.number;
      return contactPhone != null && String(contactPhone).trim().length > 0;
    });
  }
  if (query.search?.trim()) {
    rows = rows.filter((contact) => contactMatchesSearch(contact, query.search!));
  }
  return rows;
}

function compareContacts(leftContact: Contact, rightContact: Contact, field: string, dir: 'asc' | 'desc'): number {
  const leftValue = leftContact[field as keyof Contact];
  const rightValue = rightContact[field as keyof Contact];
  const leftText = leftValue == null ? '' : String(leftValue);
  const rightText = rightValue == null ? '' : String(rightValue);
  const comparison = leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'desc' ? -comparison : comparison;
}

/** Paginates an in-memory contact list (server-side data source). */
export function paginateContacts(contacts: Contact[], query: ContactsListQuery): ContactsListPageResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  let rows = filterContactsForQuery(contacts, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((leftContact, rightContact) => compareContacts(leftContact, rightContact, sortField, dir));
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);
  return {
    contacts: slice,
    total,
    page,
    limit,
    hasMore: start + slice.length < total,
  };
}

export function countActiveContactsInList(contacts: Contact[]): number {
  return contacts.filter((contact) => !isContactDeleted(contact)).length;
}

/** Returns all contacts matching a list query (no pagination). */
export function listAllContactsForQuery(contacts: Contact[], query: ContactsListQuery): Contact[] {
  let rows = filterContactsForQuery(contacts, query);
  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((leftContact, rightContact) => compareContacts(leftContact, rightContact, sortField, dir));
  }
  return rows;
}
