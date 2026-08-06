import { and, eq, inArray, isNotNull, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import {
  normalizeSearchString,
  type ContactsListPageResult,
  type ContactsListQuery,
} from '@mms/shared';
import { contacts, students, teachers, tenantUsers } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import {
  hasEmailSql,
  hasPhoneSql,
  hasWhatsAppSql,
  jsonbArrayOrEmpty,
  primaryPhoneDigitsSql,
} from './contactRepositorySql.js';
import { contactRepo, hydrateContact } from './contactRepositoryCore.js';

const TEACHER_USER_ROLES_SQL = sql`('teacher', 'assistant_teacher')`;

function existsActiveStudentLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${students}
    WHERE ${students.workspaceSubdomain} = ${subdomain}
      AND ${students.deletedAt} IS NULL
      AND NULLIF(trim(${students.contactId}), '') = ${contacts.id}
  )`;
}

function existsActiveTeacherLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${teachers}
    WHERE ${teachers.workspaceSubdomain} = ${subdomain}
      AND ${teachers.deletedAt} IS NULL
      AND NULLIF(trim(${teachers.customData}->>'contactId'), '') = ${contacts.id}
  )`;
}

function existsActiveStaffLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${tenantUsers}
    WHERE ${tenantUsers.workspaceSubdomain} = ${subdomain}
      AND ${tenantUsers.deletedAt} IS NULL
      AND NULLIF(trim(${tenantUsers.contactId}), '') = ${contacts.id}
      AND lower(${tenantUsers.role}) NOT IN ${TEACHER_USER_ROLES_SQL}
  )`;
}

const CONTACT_SORT_FIELDS = new Set([
  'name',
  'firstName',
  'lastName',
  'city',
  'gender',
  'createdAt',
  'updatedAt',
]);

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
  includeIds: string[] | undefined,
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
  if (includeIds && includeIds.length > 0) {
    conditions.push(inArray(contacts.id, includeIds));
  }

  const linkFilter = query.moduleLinkFilter;
  if (linkFilter === 'students') {
    conditions.push(existsActiveStudentLinkSql(subdomain));
  } else if (linkFilter === 'teachers') {
    conditions.push(existsActiveTeacherLinkSql(subdomain));
  } else if (linkFilter === 'staff') {
    conditions.push(existsActiveStaffLinkSql(subdomain));
  } else if (linkFilter === 'unlinked') {
    conditions.push(sql`NOT ${existsActiveStudentLinkSql(subdomain)}`);
    conditions.push(sql`NOT ${existsActiveTeacherLinkSql(subdomain)}`);
  }

  if (query.excludeLinkedModules?.includes('students')) {
    conditions.push(sql`NOT ${existsActiveStudentLinkSql(subdomain)}`);
  }
  if (query.excludeLinkedModules?.includes('teachers')) {
    conditions.push(sql`NOT ${existsActiveTeacherLinkSql(subdomain)}`);
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
  const includeIds =
    query.includeIds === undefined
      ? undefined
      : [...new Set(query.includeIds.map(String).filter(Boolean))];

  if (includeIds && includeIds.length === 0) {
    return { contacts: [], total: 0, page, limit, hasMore: false };
  }

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query, excludeIds, includeIds);
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

    const pageContacts = rows.map((row) => hydrateContact(contactRepo.rowToRecord(row)));
    return {
      contacts: pageContacts,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
