import { desc, asc, eq, inArray, isNotNull, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import {
  isQueryFlagTrue,
  normalizeSearchString,
  type ContactsListPageResult,
  type ContactsListQuery,
} from '@mms/shared';
import { contacts, students, teachers, tenantUsers, contactEmails, contactAddresses } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { runListPage } from './listPageHelper.js';
import {
  hasEmailSql,
  hasPhoneSql,
  hasWhatsAppSql,
  primaryPhoneDigitsSql,
} from './contactRepositorySql.js';
import { hydrateContactsSummaryList } from './contactRepositoryCore.js';

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
      AND NULLIF(trim(${teachers.contactId}), '') = ${contacts.id}
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
  return sql`${contacts.isSyed} IS TRUE`;
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
      COALESCE(${contacts.name}, ''),
      COALESCE(${contacts.firstName}, ''),
      COALESCE(${contacts.lastName}, ''),
      NULLIF(${primaryPhoneDigitsSql()}, ''),
      COALESCE((
        SELECT string_agg(NULLIF(trim(e.address), ''), ' ')
        FROM ${contactEmails} e
        WHERE e.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND e.contact_id = ${contacts.id}
      ), ''),
      COALESCE((
        SELECT string_agg(
          concat_ws(' ',
            NULLIF(trim(a.city), ''),
            NULLIF(trim(a.state), ''),
            NULLIF(trim(a.country), ''),
            NULLIF(trim(a.line1), '')
          ),
          ' '
        )
        FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
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
    return dir === 'desc' ? desc(contacts.updatedAt) : asc(contacts.updatedAt);
  }
  if (field === 'createdAt') {
    return dir === 'desc' ? desc(contacts.createdAt) : asc(contacts.createdAt);
  }
  if (field === 'name') {
    return dir === 'desc' ? desc(contacts.name) : asc(contacts.name);
  }
  if (field === 'firstName') {
    return dir === 'desc' ? desc(contacts.firstName) : asc(contacts.firstName);
  }
  if (field === 'lastName') {
    return dir === 'desc' ? desc(contacts.lastName) : asc(contacts.lastName);
  }
  if (field === 'gender') {
    return dir === 'desc' ? desc(contacts.gender) : asc(contacts.gender);
  }
  return sql`${contacts.id} asc`;
}

function buildListConditions(
  subdomain: string,
  query: ContactsListQuery,
  excludeIds: string[],
  includeIds: string[] | undefined,
): SQL[] {
  const conditions: SQL[] = [eq(contacts.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(contacts.deletedAt));
  } else {
    conditions.push(isNull(contacts.deletedAt));
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    if (genderFilter === 'unspecified') {
      conditions.push(sql`(
        NULLIF(trim(lower(COALESCE(${contacts.gender}, ''))), '') IS NULL
        OR lower(trim(${contacts.gender})) = 'unspecified'
      )`);
    } else {
      conditions.push(sql`lower(trim(COALESCE(${contacts.gender}, ''))) = ${genderFilter}`);
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
      conditions.push(sql`${contacts.createdAt} >= (NOW() - INTERVAL '30 days')`);
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
 * SQL-filtered contacts Work list page (typed columns & relational search/joins).
 * Search approximates normalizeSearchString (NFD + Yeh/Kaf + harakat) via SQL.
 */
export async function listContactsPage(
  tenant: string,
  query: ContactsListQuery,
): Promise<ContactsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const excludeIds = (query.excludeIds ?? []).map(String).filter(Boolean);
  const includeIds =
    query.includeIds === undefined
      ? undefined
      : [...new Set(query.includeIds.map(String).filter(Boolean))];

  if (includeIds && includeIds.length === 0) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
    return { contacts: [], total: 0, page, limit, hasMore: false };
  }

  return withTenant(subdomain, async (tx) => {
    const result = await runListPage(tx, contacts, {
      conditions: buildListConditions(subdomain, query, excludeIds, includeIds),
      orderBy: buildOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 50,
      rowMapper: (row) => row as typeof contacts.$inferSelect,
    });

    const pageContacts = await hydrateContactsSummaryList(tx, subdomain, result.items);
    return {
      contacts: pageContacts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}
