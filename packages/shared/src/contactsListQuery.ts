import { z } from 'zod';
import type { AppTranslationKey } from './appTranslations.js';
import { baseListQuerySchema } from './apiSchemas.js';
import type { Contact } from './contactTypes.js';
import { contactMatchesSearch } from './contactsSearchUtils.js';
import { filterActiveContacts, isContactDeleted } from './contactSoftDelete.js';
import { compareByField, getPrimaryEmail, getPrimaryPhone, hasWhatsApp, paginateArray } from './utils.js';

/** Work-directory filter presets — SSOT for schema + Filters menu. */
export const CONTACTS_QUICK_FILTERS = ['all', 'whatsapp', 'syed', 'missingInfo'] as const;

const contactsQuickFilterSchema = z.enum(CONTACTS_QUICK_FILTERS);

/** Work-directory quick filter preset ids. */
export type ContactsQuickFilter = z.infer<typeof contactsQuickFilterSchema>;

/** Narrow a dropdown/radio string to a Contacts quick-filter preset. */
export function isContactsQuickFilter(value: string): value is ContactsQuickFilter {
  return (CONTACTS_QUICK_FILTERS as readonly string[]).includes(value);
}

const CONTACTS_QUICK_FILTER_LABEL_KEYS = {
  all: 'contacts.filtersAll',
  whatsapp: 'contacts.filtersWhatsApp',
  syed: 'contacts.filtersSyed',
  missingInfo: 'contacts.filtersMissingInfo',
} as const satisfies Record<ContactsQuickFilter, AppTranslationKey>;

/** Preset options for the Contacts Work Filters menu. */
export const CONTACTS_QUICK_FILTER_OPTIONS: ReadonlyArray<{
  id: ContactsQuickFilter;
  labelKey: AppTranslationKey;
}> = CONTACTS_QUICK_FILTERS.map((id) => ({
  id,
  labelKey: CONTACTS_QUICK_FILTER_LABEL_KEYS[id],
}));

const booleanQueryFlag = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    return value === 'true' || value === true;
  }, z.boolean())
  .optional();

/** Validates and transforms the contacts list query received over HTTP. */
export const contactsListQuerySchema = baseListQuerySchema.extend({
  gender: z.string().optional(),
  hasPhone: booleanQueryFlag,
  hasEmail: booleanQueryFlag,
  hasReachable: booleanQueryFlag,
  quickFilter: contactsQuickFilterSchema.optional(),
  excludeIds: z
    .string()
    .max(4000)
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined,
    ),
  excludeLinkedModules: z
    .string()
    .optional()
    .transform((value) => {
      if (!value?.trim()) return undefined;
      const allowed = new Set(['students', 'teachers']);
      const modules = value
        .split(',')
        .map((part) => part.trim())
        .filter((part): part is 'students' | 'teachers' => allowed.has(part));
      return modules.length > 0 ? modules : undefined;
    }),
});

/**
 * Programmatic contacts query used after wire values have been transformed.
 * Its shared fields align with `contactsListQuerySchema` (including `hasEmail`).
 * The backend list router normalizes `includeDeleted`.
 */
export interface ContactsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  hasPhone?: boolean;
  /** Primary email present — messaging “select all with email”. */
  hasEmail?: boolean;
  /** Phone or email present — messaging Work recipient lists. */
  hasReachable?: boolean;
  /** Toolbar quick filter; omit or `all` means no preset. */
  quickFilter?: ContactsQuickFilter;
  /** Contact ids to omit from results (picker already-linked exclusions). */
  excludeIds?: Array<string | number>;
  /**
   * Server expands to linked contact ids from those modules before paging.
   * Prefer this over a large `excludeIds` query string (messaging Contacts role).
   */
  excludeLinkedModules?: Array<'students' | 'teachers'>;
}

export interface ContactsListPageResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function matchesContactsQuickFilter(contact: Contact, quickFilter: ContactsQuickFilter | undefined): boolean {
  if (!quickFilter || quickFilter === 'all') return true;
  if (quickFilter === 'whatsapp') return hasWhatsApp(contact);
  if (quickFilter === 'syed') return Boolean(contact.isSyed);
  if (quickFilter === 'missingInfo') return !getPrimaryPhone(contact) || !getPrimaryEmail(contact);
  return true;
}

export function filterContactsForQuery(contacts: Contact[], query: ContactsListQuery): Contact[] {
  let rows = query.includeDeleted
    ? contacts.filter(isContactDeleted)
    : filterActiveContacts(contacts);
  if (query.gender) {
    const genderFilter = query.gender.trim().toLowerCase();
    rows = rows.filter((contact) => {
      const gender = (contact.gender ?? '').trim().toLowerCase();
      if (genderFilter === 'unspecified') return !gender || gender === 'unspecified';
      return gender === genderFilter;
    });
  }
  if (query.hasPhone) {
    rows = rows.filter((contact) => Boolean(getPrimaryPhone(contact)));
  }
  if (query.hasEmail) {
    rows = rows.filter((contact) => Boolean(getPrimaryEmail(contact)));
  }
  if (query.hasReachable) {
    rows = rows.filter(
      (contact) => Boolean(getPrimaryPhone(contact)) || Boolean(getPrimaryEmail(contact)),
    );
  }
  if (query.quickFilter && query.quickFilter !== 'all') {
    rows = rows.filter((contact) => matchesContactsQuickFilter(contact, query.quickFilter));
  }
  if (query.excludeIds && query.excludeIds.length > 0) {
    const excluded = new Set(query.excludeIds.map(String));
    rows = rows.filter((contact) => !excluded.has(String(contact.id)));
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
