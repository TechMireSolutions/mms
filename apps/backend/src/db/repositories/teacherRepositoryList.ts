import { and, eq, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type Teacher,
  type TeachersCommandMetricsSnapshot,
  type TeachersListPageResult,
  type TeachersListQuery,
} from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { teacherRowToRecord } from './teacherRepository.js';

const TEACHER_SORT_FIELDS = new Set([
  'name',
  'employeeId',
  'specialization',
  'qualification',
  'status',
  'joinDate',
  'updatedAt',
]);

function statusExpr(): SQL {
  return sql`lower(trim(COALESCE(${teachers.customData}->>'status', 'active')))`;
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
  if (!field || !TEACHER_SORT_FIELDS.has(field)) {
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
    const statusSort = statusExpr();
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
      conditions.push(sql`${statusExpr()} IN (${sql.join(
        statuses.map((status) => sql`${status}`),
        sql`, `,
      )})`);
    }
  }

  if (query.specialization?.trim()) {
    conditions.push(sql`${specializationExpr()} = ${query.specialization.trim()}`);
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
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
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

export async function countTeachersActive(tenant: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt)));
    return Number(rows[0]?.count ?? 0);
  });
}

/**
 * Set `custom_data.status` for active teachers in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateTeachersStatusSql(
  workspaceSubdomain: string,
  ids: string[],
  status: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedStatus = status.trim().toLowerCase() || 'active';

  return withTenantTransaction(subdomain, async (tx) => {
    const updated = await tx
      .update(teachers)
      .set({
        customData: sql`jsonb_set(
          COALESCE(${teachers.customData}, '{}'::jsonb),
          '{status}',
          to_jsonb(${normalizedStatus}::text),
          true
        )`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          inArray(teachers.id, uniqueIds),
          isNull(teachers.deletedAt),
        ),
      )
      .returning({ id: teachers.id });
    return updated.length;
  });
}

/** SQL aggregates for Teachers command-centre metrics (active rows only). */
export async function aggregateTeachersCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<TeachersCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const joinDateRaw = sql`NULLIF(trim(COALESCE(
      ${teachers.customData}->>'joinDate',
      ${teachers.customData}->>'createdAt',
      ''
    )), '')`;

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'active')::int`,
        inactive: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'inactive')::int`,
        onLeave: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'on_leave')::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${joinDateRaw} IS NOT NULL
          AND ${joinDateRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${joinDateRaw})::timestamptz
            >= (NOW() - (${periodDays} * INTERVAL '1 day'))
        )::int`,
      })
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      onLeave: Number(row?.onLeave ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
    };
  });
}
