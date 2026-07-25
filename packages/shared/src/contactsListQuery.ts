import type { Contact } from './contactTypes.js';
import { contactMatchesSearch } from './contactsSearchUtils.js';
import { filterActiveContacts, isContactDeleted } from './contactSoftDelete.js';
import { compareByField, paginateArray } from './utils.js';

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
      const contactPhone = contact.phones?.[0]?.number;
      return contactPhone != null && String(contactPhone).trim().length > 0;
    });
  }
  if (query.search?.trim()) {
    rows = rows.filter((contact) => contactMatchesSearch(contact, query.search!));
  }
  return rows;
}

/** Paginates an in-memory contact list (server-side data source). */
export function paginateContacts(contacts: Contact[], query: ContactsListQuery): ContactsListPageResult {
  let rows = filterContactsForQuery(contacts, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((leftContact, rightContact) => compareByField(leftContact, rightContact, sortField, dir));
  }

  const result = paginateArray(rows, query.page ?? 1, query.limit ?? 50, 500);
  return {
    contacts: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
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
    rows = [...rows].sort((leftContact, rightContact) => compareByField(leftContact, rightContact, sortField, dir));
  }
  return rows;
}
