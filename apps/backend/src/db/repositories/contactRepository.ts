import { and, eq, isNotNull, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  normalizeSearchString,
  stripContactClientSoftDeleteFields,
  type Contact,
  type ContactsListPageResult,
  type ContactsListQuery,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { createGenericRepository, type ListByWorkspaceOptions } from './genericRepository.js';

const repo = createGenericRepository<Contact, typeof contacts>(contacts, {
  updateStrategy: 'overwrite',
  conflictTarget: [contacts.workspaceSubdomain, contacts.id],
  syncDeletedAtColumn: true,
});

const CONTACT_SORT_FIELDS = new Set([
  'name',
  'firstName',
  'lastName',
  'city',
  'gender',
  'createdAt',
  'updatedAt',
]);

function hydrateContact(contact: Contact): Contact {
  return hydrateContactRelationshipFields(contact) as Contact;
}

type ContactRow = {
  id: string;
  customData: unknown;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
};

function rowToContact(row: ContactRow): Contact {
  const data = {
    ...(row.customData as Omit<Contact, 'id'>),
    id: row.id,
  } as Contact;

  if (row.deletedAt instanceof Date) {
    data.deletedAt = row.deletedAt.toISOString();
    if (row.deletedBy) data.deletedBy = String(row.deletedBy);
    else delete data.deletedBy;
    if (row.deletionReason) data.deletionReason = String(row.deletionReason);
    else delete data.deletionReason;
    return hydrateContact(data);
  }

  return hydrateContact(stripContactClientSoftDeleteFields(data as Record<string, unknown>) as Contact);
}

/** JSONB array path, or empty array when missing/non-array (avoids jsonb_array_elements errors). */
function jsonbArrayOrEmpty(field: 'phones' | 'emails' | 'addresses'): SQL {
  return sql`(CASE
    WHEN jsonb_typeof(${contacts.customData}->${field}) = 'array'
    THEN ${contacts.customData}->${field}
    ELSE '[]'::jsonb
  END)`;
}

/** True when contact has a non-empty primary/legacy phone number in JSONB. */
function hasPhoneSql(): SQL {
  return sql`(
    NULLIF(trim(COALESCE(${contacts.customData}->>'phone', '')), '') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
      WHERE NULLIF(trim(phone.value->>'number'), '') IS NOT NULL
    )
  )`;
}

/** True when contact has a non-empty primary/legacy email in JSONB. */
function hasEmailSql(): SQL {
  return sql`(
    NULLIF(trim(COALESCE(${contacts.customData}->>'email', '')), '') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
      WHERE NULLIF(trim(email.value->>'address'), '') IS NOT NULL
    )
  )`;
}

/**
 * WhatsApp eligibility approx: dialable digit length 8–15 on primary phone.
 * Phone precedence matches getPrimaryPhone: phones[] (primary first) then scalar phone.
 */
function hasWhatsAppSql(): SQL {
  return sql`(
    length(regexp_replace(
      COALESCE(
        (
          SELECT NULLIF(trim(phone.value->>'number'), '')
          FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
          WHERE NULLIF(trim(phone.value->>'number'), '') IS NOT NULL
          ORDER BY CASE WHEN COALESCE((phone.value->>'isPrimary')::boolean, false) THEN 0 ELSE 1 END
          LIMIT 1
        ),
        NULLIF(trim(COALESCE(${contacts.customData}->>'phone', '')), ''),
        ''
      ),
      '[^0-9]',
      '',
      'g'
    )) BETWEEN 8 AND 15
  )`;
}

function isSyedSql(): SQL {
  return sql`COALESCE((${contacts.customData}->>'isSyed')::boolean, false) = true`;
}

/** Approximate normalizeSearchString for SQL haystacks (Yeh/Kaf + harakat strip + lower). */
function sqlNormalizeSearchExpr(expr: SQL): SQL {
  // Arabic Yeh (ي) / Kaf (ك) → Persian/Urdu Yeh (ی) / Kaf (ک) — same as normalizeSearchString.
  const fromChars = '\u064A\u0643';
  const toChars = '\u06CC\u06A9';
  return sql`lower(
    translate(
      regexp_replace(${expr}, '[\u064B-\u065F\u0670]', '', 'g'),
      ${fromChars},
      ${toChars}
    )
  )`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = normalizeSearchString(search.trim());
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  const haystack = sql`concat_ws(' ',
      COALESCE(${contacts.customData}->>'name', ''),
      COALESCE(${contacts.customData}->>'firstName', ''),
      COALESCE(${contacts.customData}->>'lastName', ''),
      COALESCE(${contacts.customData}->>'city', ''),
      COALESCE(${contacts.customData}->>'phone', ''),
      COALESCE(${contacts.customData}->>'email', ''),
      COALESCE((
        SELECT string_agg(NULLIF(trim(phone.value->>'number'), ''), ' ')
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
      ), ''),
      COALESCE((
        SELECT string_agg(NULLIF(trim(email.value->>'address'), ''), ' ')
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
      ), ''),
      COALESCE((
        SELECT string_agg(
          concat_ws(' ',
            NULLIF(trim(addr.value->>'city'), ''),
            NULLIF(trim(addr.value->>'state'), ''),
            NULLIF(trim(addr.value->>'country'), ''),
            NULLIF(trim(addr.value->>'line1'), '')
          ),
          ' '
        )
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('addresses')}) AS addr(value)
      ), '')
    )`;
  return sql`(${sqlNormalizeSearchExpr(haystack)} LIKE ${pattern})`;
}

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !CONTACT_SORT_FIELDS.has(field)) {
    return sql`${contacts.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc' ? sql`${contacts.updatedAt} desc nulls last` : sql`${contacts.updatedAt} asc nulls last`;
  }
  const jsonKey = field;
  return dir === 'desc'
    ? sql`${contacts.customData}->>${jsonKey} desc nulls last`
    : sql`${contacts.customData}->>${jsonKey} asc nulls last`;
}

function buildListConditions(
  subdomain: string,
  query: ContactsListQuery,
  excludeIds: string[],
): SQL[] {
  const conditions: SQL[] = [eq(contacts.workspaceSubdomain, subdomain)];

  if (query.includeDeleted) {
    conditions.push(isNotNull(contacts.deletedAt));
  } else {
    conditions.push(isNull(contacts.deletedAt));
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    if (genderFilter === 'unspecified') {
      conditions.push(sql`(
        NULLIF(trim(lower(COALESCE(${contacts.customData}->>'gender', ''))), '') IS NULL
        OR lower(trim(${contacts.customData}->>'gender')) = 'unspecified'
      )`);
    } else {
      conditions.push(sql`lower(trim(COALESCE(${contacts.customData}->>'gender', ''))) = ${genderFilter}`);
    }
  }

  if (query.hasPhone) {
    conditions.push(hasPhoneSql());
  }
  if (query.hasEmail) {
    conditions.push(hasEmailSql());
  }
  if (query.hasReachable) {
    conditions.push(sql`(${hasPhoneSql()} OR ${hasEmailSql()})`);
  }

  const quick = query.quickFilter;
  if (quick && quick !== 'all') {
    if (quick === 'whatsapp') conditions.push(hasWhatsAppSql());
    else if (quick === 'syed') conditions.push(isSyedSql());
    else if (quick === 'missingInfo') {
      conditions.push(sql`(NOT ${hasPhoneSql()} OR NOT ${hasEmailSql()})`);
    }
  }

  if (excludeIds.length > 0) {
    conditions.push(notInArray(contacts.id, excludeIds));
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}

/**
 * SQL-filtered contacts Work list page (soft-delete column + JSONB person filters).
 * Search is lowercased LIKE (not full Unicode normalizeSearchString parity).
 */
export async function listContactsPage(
  tenant: string,
  query: ContactsListQuery,
): Promise<ContactsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  const offset = (page - 1) * limit;
  const excludeIds = (query.excludeIds ?? []).map(String).filter(Boolean);

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query, excludeIds);
    const whereClause = and(...conditions);
    const orderBy = buildOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(contacts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const pageContacts = (rows as ContactRow[]).map(rowToContact);
    return {
      contacts: pageContacts,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function listContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<Contact[]> {
  const rows = await repo.listByWorkspace(tenant, options);
  return rows.map(hydrateContact);
}

export async function countContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<number> {
  return repo.countByWorkspace(tenant, options);
}

export async function findContactById(tenant: string, id: string): Promise<Contact | null> {
  const row = await repo.findById(tenant, id);
  return row ? hydrateContact(row) : null;
}

export async function findContactsByIds(tenant: string, ids: string[]): Promise<Contact[]> {
  const rows = await repo.findByIds(tenant, ids);
  return rows.map(hydrateContact);
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  await repo.save(tenant, hydrateContact(contact));
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  await repo.bulkSave(tenant, records.map(hydrateContact));
}

export const deleteContact = repo.deleteById;
export const replaceContactsForWorkspace = repo.replaceForWorkspace;
export const deleteContactsByWorkspace = repo.deleteByWorkspace;
