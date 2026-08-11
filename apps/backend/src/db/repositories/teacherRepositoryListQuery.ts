import { and, asc, eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import {
  DEFAULT_TEACHER_STATUS,
  TEACHERS_MODULE_MANIFEST,
  TEACHER_SORT_FIELD_SET,
  teachersQuickFilterStatusValue,
  type Teacher,
  type TeachersListPageResult,
  type TeachersListQuery,
} from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { teacherRowToRecord } from './teacherRepository.js';

/** Shared status expression for Teachers list filters + metrics. */
export function teacherStatusExpr(): SQL {
  return sql`lower(trim(COALESCE(${teachers.customData}->>'status', ${DEFAULT_TEACHER_STATUS})))`;
}

function specializationExpr(): SQL {
  return sql`trim(COALESCE(${teachers.customData}->>'specialization', ''))`;
}

function employeeIdExpr(): SQL {
  return sql`lower(trim(COALESCE(${teachers.customData}->>'employeeId', '')))`;
}

/** Display name from linked contact for Work sort (Contacts SSOT). */
function linkedContactNameSortExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT COALESCE(
      NULLIF(trim(concat_ws(' ', c.custom_data->>'firstName', c.custom_data->>'lastName')), ''),
      NULLIF(trim(COALESCE(c.custom_data->>'name', '')), ''),
      ''
    )
    FROM contacts c
    WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
      AND c.id = ${teachers.contactId}
    LIMIT 1
  ), '')))`;
}

/** Gender from linked contact (Contacts SSOT — not teachers custom_data). */
function linkedContactGenderExpr(): SQL {
  return sql`lower(trim(COALESCE((
    SELECT c.custom_data->>'gender'
    FROM contacts c
    WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
      AND c.id = ${teachers.contactId}
    LIMIT 1
  ), '')))`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${teachers.customData}->>'employeeId', '')) LIKE ${pattern}
    OR lower(COALESCE(${teachers.customData}->>'specialization', '')) LIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain}
        AND c.id = ${teachers.contactId}
        AND (
          lower(COALESCE(c.custom_data->>'name', '')) LIKE ${pattern}
          OR lower(concat_ws(' ', c.custom_data->>'firstName', c.custom_data->>'lastName')) LIKE ${pattern}
          OR lower(COALESCE(c.custom_data->>'firstName', '')) LIKE ${pattern}
          OR lower(COALESCE(c.custom_data->>'lastName', '')) LIKE ${pattern}
        )
    )
  )`;
}

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !TEACHER_SORT_FIELD_SET.has(field)) {
    return sql`${teachers.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${teachers.updatedAt} desc nulls last`
      : sql`${teachers.updatedAt} asc nulls last`;
  }
  if (field === 'name') {
    const nameSort = linkedContactNameSortExpr();
    return dir === 'desc' ? sql`${nameSort} desc nulls last` : sql`${nameSort} asc nulls last`;
  }
  if (field === 'status') {
    const statusSort = teacherStatusExpr();
    return dir === 'desc' ? sql`${statusSort} desc nulls last` : sql`${statusSort} asc nulls last`;
  }
  if (field === 'employeeId') {
    const empSort = employeeIdExpr();
    return dir === 'desc' ? sql`${empSort} desc nulls last` : sql`${empSort} asc nulls last`;
  }
  if (field === 'specialization') {
    const specSort = specializationExpr();
    return dir === 'desc' ? sql`${specSort} desc nulls last` : sql`${specSort} asc nulls last`;
  }
  return dir === 'desc'
    ? sql`${teachers.customData}->>${field} desc nulls last`
    : sql`${teachers.customData}->>${field} asc nulls last`;
}

function buildListConditions(subdomain: string, query: TeachersListQuery & { includeDeleted?: boolean }): SQL[] {
  const conditions: SQL[] = [eq(teachers.workspaceSubdomain, subdomain)];

  if (query.includeDeleted) {
    conditions.push(isNotNull(teachers.deletedAt));
  } else {
    conditions.push(isNull(teachers.deletedAt));
  }

  if (query.status?.trim()) {
    const statuses = query.status
      .split(',')
      .map((status) => status.trim().toLowerCase())
      .filter(Boolean);
    if (statuses.length > 0) {
      conditions.push(sql`${teacherStatusExpr()} IN (${sql.join(
        statuses.map((status) => sql`${status}`),
        sql`, `,
      )})`);
    }
  }

  if (query.specialization?.trim()) {
    conditions.push(sql`${specializationExpr()} = ${query.specialization.trim()}`);
  }

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${linkedContactGenderExpr()} = ${genderFilter}`);
  }

  const quickFilter = query.quickFilter;
  if (quickFilter && quickFilter !== 'all') {
    if (quickFilter === 'missingEmployeeId') {
      conditions.push(sql`NULLIF(trim(COALESCE(${teachers.customData}->>'employeeId', '')), '') IS NULL`);
    } else {
      const statusValue = teachersQuickFilterStatusValue(quickFilter);
      if (statusValue) conditions.push(sql`${teacherStatusExpr()} = ${statusValue}`);
    }
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}

/**
 * SQL-filtered teachers Work list page (typed deleted_at + contact join for name).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listTeachersPage(
  tenant: string,
  query: TeachersListQuery & { includeDeleted?: boolean },
): Promise<TeachersListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(
    Math.max(1, query.limit ?? TEACHERS_MODULE_MANIFEST.defaultPageSize),
    TEACHERS_MODULE_MANIFEST.maxPageSize,
  );
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(teachers)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      teachers: rows.map((row) => teacherRowToRecord(row as never)) as Teacher[],
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function countTeachersActive(
  tenant: string,
  options?: { includeDeleted?: boolean },
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const whereClause = options?.includeDeleted
      ? eq(teachers.workspaceSubdomain, subdomain)
      : and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt));
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(whereClause);
    return Number(rows[0]?.count ?? 0);
  });
}

/** Active teacher count for next employee-id sequencing (Students GR-count parity). */
export async function countTeachersForNextEmployeeId(tenant: string): Promise<number> {
  return countTeachersActive(tenant);
}

/** Active teachers missing typed `employee_id` (null or blank) — backfill candidates. */
export async function listActiveTeachersMissingEmployeeId(
  workspaceSubdomain: string,
): Promise<Teacher[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          isNull(teachers.deletedAt),
          sql`NULLIF(trim(COALESCE(${teachers.customData}->>'employeeId', '')), '') IS NULL`,
        ),
      )
      .orderBy(asc(teachers.id));
    return rows.map(teacherRowToRecord);
  });
}

/** Distinct linked contact ids for active teachers (typed contact_id). */
export async function listTeacherLinkedContactIdsSql(
  tenant: string,
  excludeTeacherId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const conditions: SQL[] = [
      eq(teachers.workspaceSubdomain, subdomain),
      isNull(teachers.deletedAt),
      isNotNull(teachers.contactId),
      sql`NULLIF(trim(${teachers.contactId}), '') IS NOT NULL`,
    ];
    if (excludeTeacherId?.trim()) {
      conditions.push(ne(teachers.id, excludeTeacherId.trim()));
    }
    const rows = await tx
      .select({ contactId: teachers.contactId })
      .from(teachers)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}

/**
 * Finds a soft-deleted teacher whose `contact_id` matches (re-registration
 * restore-on-create probe). Only deleted rows are candidates so an active
 * duplicate is never accidentally restored.
 */
export async function findSoftDeletedTeacherByContactIdSql(
  tenant: string,
  contactId: string,
): Promise<ReturnType<typeof teacherRowToRecord> | null> {
  const subdomain = tenant.trim().toLowerCase();
  const trimmedContactId = contactId.trim();
  if (!trimmedContactId) return null;
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          eq(teachers.contactId, trimmedContactId),
          sql`${teachers.deletedAt} is not null`,
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? teacherRowToRecord(row as never) : null;
  });
}

/**
 * Probes for an active teacher already linked to the same contact or using the
 * same employee id (server-authoritative duplicate check on save).
 */
export async function findTeacherRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    employeeId?: string;
  },
): Promise<'contact' | 'employeeId' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(teachers.workspaceSubdomain, subdomain),
      isNull(teachers.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(teachers.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(...baseConditions, eq(teachers.contactId, contactId)))
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const employeeId = input.employeeId?.trim().toLowerCase();
    if (employeeId) {
      const rows = await tx
        .select({ id: teachers.id })
        .from(teachers)
        .where(
          and(
            ...baseConditions,
            sql`${employeeIdExpr()} = ${employeeId}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'employeeId';
    }

    return null;
  });
}
