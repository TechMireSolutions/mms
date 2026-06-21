import type { Contact } from './contactTypes.js';
import { contactMatchesSearch } from './contactsSearchUtils.js';
import { filterActiveContacts, isContactDeleted } from './contactSoftDelete.js';

export interface ContactsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  lifecycleStage?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
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
  if (query.lifecycleStage) {
    rows = rows.filter((c) => (c.lifecycleStage || 'Lead') === query.lifecycleStage);
  }
  if (query.gender) {
    rows = rows.filter((c) => c.gender === query.gender);
  }
  if (query.search?.trim()) {
    rows = rows.filter((c) => contactMatchesSearch(c, query.search!));
  }
  return rows;
}

function compareContacts(a: Contact, b: Contact, field: string, dir: 'asc' | 'desc'): number {
  const av = a[field as keyof Contact];
  const bv = b[field as keyof Contact];
  const aStr = av == null ? '' : String(av);
  const bStr = bv == null ? '' : String(bv);
  const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'desc' ? -cmp : cmp;
}

/** Paginates an in-memory contact list (server-side data source). */
export function paginateContacts(contacts: Contact[], query: ContactsListQuery): ContactsListPageResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  let rows = filterContactsForQuery(contacts, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((a, b) => compareContacts(a, b, sortField, dir));
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
  return contacts.filter((c) => !isContactDeleted(c)).length;
}

/** Returns all contacts matching a list query (no pagination). */
export function listAllContactsForQuery(contacts: Contact[], query: ContactsListQuery): Contact[] {
  let rows = filterContactsForQuery(contacts, query);
  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((a, b) => compareContacts(a, b, sortField, dir));
  }
  return rows;
}
