import { and, eq, isNotNull, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  normalizeSearchString,
  type Contact,
  type ContactsListPageResult,
  type ContactsListQuery,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { createGenericRepository, type ListByWorkspaceOptions } from './genericRepository.js';
import {
  contactFieldNonEmptySql,
  hasEmailSql,
  hasPhoneSql,
  hasWhatsAppSql,
  jsonbArrayOrEmpty,
  primaryPhoneDigitsSql,
} from './contactRepositorySql.js';

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

function isSyedSql(): SQL {
  return sql`COALESCE((${contacts.customData}->>'isSyed')::boolean, false) = true`;
}

/**
 * Approximate normalizeSearchString in SQL:
 * NFD → strip Latin combining marks → strip Arabic harakat → Yeh/Kaf → lower.
 */
function sqlNormalizeSearchExpr(expr: SQL): SQL {
  const fromChars = '\u064A\u0643';
  const toChars = '\u06CC\u06A9';
  return sql`lower(
    translate(
      regexp_replace(
        regexp_replace(
          normalize(${expr}, NFD),
          '[\u0300-\u036f]',
          '',
          'g'
        ),
        '[\u064B-\u065F\u0670]',
        '',
        'g'
      ),
      ${fromChars},
      ${toChars}
    )
  )`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = normalizeSearchString(search.trim());
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  // Haystack mirrors getContactSearchHaystack: name parts, primary phone, all emails, addresses.
  const haystack = sql`concat_ws(' ',
      COALESCE(${contacts.customData}->>'name', ''),
      COALESCE(${contacts.customData}->>'firstName', ''),
      COALESCE(${contacts.customData}->>'lastName', ''),
      COALESCE(${contacts.customData}->>'city', ''),
      COALESCE(${contacts.customData}->>'phone', ''),
      COALESCE(${contacts.customData}->>'email', ''),
      NULLIF(${primaryPhoneDigitsSql()}, ''),
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
    } else if (quick === 'recent') {
      conditions.push(sql`(
        NULLIF(trim(COALESCE(${contacts.customData}->>'createdAt', '')), '') IS NOT NULL
        AND (${contacts.customData}->>'createdAt')::timestamptz >= (NOW() - INTERVAL '30 days')
      )`);
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
 * Search approximates normalizeSearchString (NFD + Yeh/Kaf + harakat) via SQL.
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

    const pageContacts = rows.map((row) => hydrateContact(repo.rowToRecord(row)));
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

export interface ContactUniqueLookupValues {
  /** Digits-only phone numbers to match against phones[] / scalar phone. */
  phoneDigits: string[];
  /** Lowercased email addresses to match against emails[] / scalar email. */
  emails: string[];
  /** Scalar unique fields: JSONB text equality after lower(trim). */
  scalars: Array<{ fieldKey: string; normalized: string }>;
}

/**
 * Normalized active contact names that match any of the candidates (lower/trim).
 * Used by Google sync name-dedupe without a full-tenant hydrate.
 */
export async function findExistingNormalizedContactNames(
  tenant: string,
  names: string[],
): Promise<Set<string>> {
  const normalized = [
    ...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean)),
  ];
  if (normalized.length === 0) return new Set();

  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        name: sql<string>`lower(trim(COALESCE(${contacts.customData}->>'name', '')))`,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceSubdomain, subdomain),
          isNull(contacts.deletedAt),
          sql`lower(trim(COALESCE(${contacts.customData}->>'name', ''))) IN (${sql.join(
            normalized.map((name) => sql`${name}`),
            sql`, `,
          )})`,
        ),
      );
    return new Set(rows.map((row) => row.name).filter(Boolean));
  });
}

/**
 * Active contacts that may collide on any of the candidate unique values.
 * Scoped SQL lookup — avoids loading the full tenant for uniqueness checks.
 */
export async function findActiveContactsMatchingUniqueValues(
  tenant: string,
  values: ContactUniqueLookupValues,
  excludeIds: Array<string | number> = [],
): Promise<Contact[]> {
  const phoneDigits = [...new Set(values.phoneDigits.map((v) => v.trim()).filter(Boolean))];
  const emails = [...new Set(values.emails.map((v) => v.trim().toLowerCase()).filter(Boolean))];
  const scalars = values.scalars.filter(
    (entry) => entry.fieldKey.trim() && entry.normalized.trim(),
  );
  if (phoneDigits.length === 0 && emails.length === 0 && scalars.length === 0) {
    return [];
  }

  const subdomain = tenant.trim().toLowerCase();
  const excluded = [...new Set(excludeIds.map(String).filter(Boolean))];
  const matchClauses: SQL[] = [];

  if (phoneDigits.length > 0) {
    matchClauses.push(sql`(
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
        WHERE regexp_replace(
          CASE
            WHEN NULLIF(trim(phone.value->>'number'), '') LIKE '+%'
              THEN trim(phone.value->>'number')
            ELSE concat_ws(
              '',
              NULLIF(trim(phone.value->>'countryCode'), ''),
              NULLIF(trim(phone.value->>'number'), '')
            )
          END,
          '[^0-9]',
          '',
          'g'
        ) IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
      )
      OR regexp_replace(COALESCE(${contacts.customData}->>'phone', ''), '[^0-9]', '', 'g')
        IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
    )`);
  }

  if (emails.length > 0) {
    matchClauses.push(sql`(
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
        WHERE lower(trim(COALESCE(email.value->>'address', '')))
          IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
      )
      OR lower(trim(COALESCE(${contacts.customData}->>'email', '')))
        IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
    )`);
  }

  for (const scalar of scalars) {
    matchClauses.push(sql`(
      lower(trim(COALESCE(${contacts.customData}->>${scalar.fieldKey}, ''))) = ${scalar.normalized}
    )`);
  }

  const whereParts: SQL[] = [
    eq(contacts.workspaceSubdomain, subdomain),
    isNull(contacts.deletedAt),
    sql`(${sql.join(matchClauses, sql` OR `)})`,
  ];
  if (excluded.length > 0) {
    whereParts.push(notInArray(contacts.id, excluded));
  }

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contacts)
      .where(and(...whereParts));
    return rows.map((row) => hydrateContact(repo.rowToRecord(row)));
  });
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  await repo.save(tenant, hydrateContact(contact));
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  await repo.bulkSave(tenant, records.map(hydrateContact));
}

/**
 * Counts active contacts with a non-empty value for each field key (SQL, no full-list load).
 * Single-pass `count(*) FILTER` per key. Every requested key is present (default 0).
 */
export async function countFieldUsageByKeys(
  tenant: string,
  fieldKeys: string[],
): Promise<Record<string, number>> {
  const uniqueKeys = [...new Set(fieldKeys.map((key) => key.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }

  const subdomain = tenant.trim().toLowerCase();
  // Stable aliases — field keys are not always safe SQL identifiers.
  const selection = Object.fromEntries(
    uniqueKeys.map((fieldKey, index) => [
      `k${index}`,
      sql<number>`count(*) FILTER (WHERE ${contactFieldNonEmptySql(fieldKey)})::int`.as(
        `k${index}`,
      ),
    ]),
  );

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select(selection)
      .from(contacts)
      .where(and(eq(contacts.workspaceSubdomain, subdomain), isNull(contacts.deletedAt)));

    const row = (rows[0] ?? {}) as Record<string, number | null | undefined>;
    const counts: Record<string, number> = {};
    for (let index = 0; index < uniqueKeys.length; index += 1) {
      counts[uniqueKeys[index]] = Number(row[`k${index}`] ?? 0);
    }
    return Object.fromEntries(
      fieldKeys.map((key) => [key.trim(), counts[key.trim()] ?? 0]),
    );
  });
}

export const deleteContact = repo.deleteById;
export const replaceContactsForWorkspace = repo.replaceForWorkspace;
export const deleteContactsByWorkspace = repo.deleteByWorkspace;
