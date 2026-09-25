import { sql, type SQL } from 'drizzle-orm';
import { dedupeTrimmedIds, type ContactsListPageResult, type ContactsListQuery } from '@mms/shared';
import { contacts, students, teachers, tenantUsers } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import { runListPage } from './listPageHelper.js';
import { hydrateContactsSummaryList } from './contactRepositoryCore.js';
import { buildListConditions, buildOrderBy } from './contactRepositoryListFilter.js';

export const TEACHER_USER_ROLES_SQL = sql`('teacher', 'assistant_teacher')`;

export function existsActiveStudentLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${students}
    WHERE ${students.workspaceSubdomain} = ${subdomain}
      AND ${students.deletedAt} IS NULL
      AND NULLIF(trim(${students.contactId}), '') = ${contacts.id}
  )`;
}

export function existsActiveTeacherLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${teachers}
    WHERE ${teachers.workspaceSubdomain} = ${subdomain}
      AND ${teachers.deletedAt} IS NULL
      AND NULLIF(trim(${teachers.contactId}), '') = ${contacts.id}
  )`;
}

export function existsActiveStaffLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${tenantUsers}
    WHERE ${tenantUsers.workspaceSubdomain} = ${subdomain}
      AND ${tenantUsers.deletedAt} IS NULL
      AND NULLIF(trim(${tenantUsers.contactId}), '') = ${contacts.id}
      AND lower(${tenantUsers.role}) NOT IN ${TEACHER_USER_ROLES_SQL}
  )`;
}

export const CONTACT_LIST_COLUMNS = {
  id: contacts.id,
  workspaceSubdomain: contacts.workspaceSubdomain,
  firstName: contacts.firstName,
  lastName: contacts.lastName,
  name: contacts.name,
  gender: contacts.gender,
  dob: contacts.dob,
  cnic: contacts.cnic,
  isSyed: contacts.isSyed,
  avatar: contacts.avatar,
  whatsappStatus: contacts.whatsappStatus,
  lastCheckedAt: contacts.lastCheckedAt,
  deletedAt: contacts.deletedAt,
  deletedBy: contacts.deletedBy,
  deletionReason: contacts.deletionReason,
  createdAt: contacts.createdAt,
  updatedAt: contacts.updatedAt,
  createdBy: contacts.createdBy,
  updatedBy: contacts.updatedBy,
};

/**
 * SQL-filtered contacts Work list page (typed columns & relational search/joins).
 * Search approximates normalizeSearchString (NFD + Yeh/Kaf + harakat) via SQL.
 */
export async function listContactsPage(
  tenant: string,
  query: ContactsListQuery & { afterId?: string; skipCount?: boolean },
): Promise<ContactsListPageResult & { nextCursor?: string }> {
  const subdomain = tenant.trim().toLowerCase();
  const excludeIds = dedupeTrimmedIds(query.excludeIds ?? []);
  const includeIds =
    query.includeIds === undefined
      ? undefined
      : dedupeTrimmedIds(query.includeIds);

  if (includeIds && includeIds.length === 0) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
    return { contacts: [], total: 0, page, limit, hasMore: false };
  }

  return withTenantRead(subdomain, async (tx) => {
    const result = await runListPage(tx, contacts, {
      conditions: buildListConditions(subdomain, query, excludeIds, includeIds),
      orderBy: buildOrderBy(query.sortField, query.sortDir),
      columns: CONTACT_LIST_COLUMNS,
      page: query.page,
      limit: query.limit,
      afterId: query.afterId,
      skipCount: query.skipCount,
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
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    };
  });
}
