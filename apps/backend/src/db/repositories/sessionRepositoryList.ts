import { and, eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  type Session,
  type SessionsCommandMetricsSnapshot,
  type SessionsListPageResult,
  type SessionsListQuery,
} from '@mms/shared';
import { sessions } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { sessionRowToRecord } from './sessionRepository.js';

const SESSION_SORT_FIELDS = new Set([
  'name',
  'type',
  'status',
  'baseFee',
  'startDate',
  'endDate',
  'updatedAt',
]);

function statusExpr(): SQL {
  return sql`lower(trim(COALESCE(${sessions.customData}->>'status', '')))`;
}

function typeExpr(): SQL {
  return sql`lower(trim(COALESCE(${sessions.customData}->>'type', '')))`;
}

function nameExpr(): SQL {
  return sql`lower(trim(COALESCE(${sessions.customData}->>'name', '')))`;
}

function baseFeeExpr(): SQL {
  return sql`COALESCE((${sessions.customData}->>'baseFee')::numeric, 0)`;
}

function startDateExpr(): SQL {
  return sql`NULLIF(trim(COALESCE(${sessions.customData}->>'startDate', '')), '')`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    ${nameExpr()} LIKE ${pattern}
    OR ${typeExpr()} LIKE ${pattern}
    OR lower(COALESCE(${sessions.customData}->>'description', '')) LIKE ${pattern}
  )`;
}

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !SESSION_SORT_FIELDS.has(field)) {
    return sql`${sessions.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${sessions.updatedAt} desc nulls last`
      : sql`${sessions.updatedAt} asc nulls last`;
  }
  if (field === 'name') {
    const nameSort = nameExpr();
    return dir === 'desc' ? sql`${nameSort} desc nulls last` : sql`${nameSort} asc nulls last`;
  }
  if (field === 'status') {
    const statusSort = statusExpr();
    return dir === 'desc' ? sql`${statusSort} desc nulls last` : sql`${statusSort} asc nulls last`;
  }
  if (field === 'type') {
    const typeSort = typeExpr();
    return dir === 'desc' ? sql`${typeSort} desc nulls last` : sql`${typeSort} asc nulls last`;
  }
  if (field === 'baseFee') {
    const feeSort = baseFeeExpr();
    return dir === 'desc' ? sql`${feeSort} desc nulls last` : sql`${feeSort} asc nulls last`;
  }
  if (field === 'startDate' || field === 'endDate') {
    const dateSort = sql`NULLIF(trim(COALESCE(${sessions.customData}->>${field}, '')), '')`;
    return dir === 'desc' ? sql`${dateSort} desc nulls last` : sql`${dateSort} asc nulls last`;
  }
  return dir === 'desc'
    ? sql`${sessions.customData}->>${field} desc nulls last`
    : sql`${sessions.customData}->>${field} asc nulls last`;
}

function buildListConditions(subdomain: string, query: SessionsListQuery): SQL[] {
  const conditions: SQL[] = [eq(sessions.workspaceSubdomain, subdomain)];

  if (query.includeDeleted) {
    conditions.push(isNotNull(sessions.deletedAt));
  } else {
    conditions.push(isNull(sessions.deletedAt));
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

  if (query.type?.trim()) {
    const types = query.type
      .split(',')
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);
    if (types.length > 0) {
      conditions.push(sql`${typeExpr()} IN (${sql.join(
        types.map((type) => sql`${type}`),
        sql`, `,
      )})`);
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
 * SQL-filtered sessions Work list page (typed deleted_at + JSONB filters).
 * includeDeleted → deleted-only (Work trash parity).
 */
export async function listSessionsPage(
  tenant: string,
  query: SessionsListQuery,
): Promise<SessionsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(sessions)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      sessions: rows.map((row) => sessionRowToRecord(row as never)) as Session[],
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function countSessionsActive(tenant: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), isNull(sessions.deletedAt)));
    return Number(rows[0]?.count ?? 0);
  });
}

const classesArrayExpr = sql`COALESCE(${sessions.customData}->'classes', '[]'::jsonb)`;

const enrolledSumExpr = sql<number>`coalesce((
  SELECT sum(coalesce((elem->>'enrolled')::int, 0))
  FROM jsonb_array_elements(${classesArrayExpr}) AS elem
), 0)::int`;

const capacitySumExpr = sql<number>`coalesce((
  SELECT sum(coalesce((elem->>'capacity')::int, 0))
  FROM jsonb_array_elements(${classesArrayExpr}) AS elem
), 0)::int`;

const classCountExpr = sql<number>`coalesce(jsonb_array_length(${classesArrayExpr}), 0)::int`;

/** SQL aggregates for Sessions command-centre metrics (active rows only). */
export async function aggregateSessionsCommandMetrics(
  tenant: string,
): Promise<SessionsCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const startDateRaw = startDateExpr();

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'active')::int`,
        upcoming: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'upcoming')::int`,
        completed: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'completed')::int`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'cancelled')::int`,
        totalEnrolled: sql<number>`coalesce(sum(${enrolledSumExpr}), 0)::int`,
        totalCapacity: sql<number>`coalesce(sum(${capacitySumExpr}), 0)::int`,
        totalClasses: sql<number>`coalesce(sum(${classCountExpr}), 0)::int`,
        sessionsThisWeek: sql<number>`count(*) FILTER (WHERE
          ${startDateRaw} IS NOT NULL
          AND ${startDateRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${startDateRaw})::date >= (CURRENT_DATE - INTERVAL '6 days')
          AND (${startDateRaw})::date <= CURRENT_DATE
        )::int`,
        sessionsLastWeek: sql<number>`count(*) FILTER (WHERE
          ${startDateRaw} IS NOT NULL
          AND ${startDateRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${startDateRaw})::date >= (CURRENT_DATE - INTERVAL '13 days')
          AND (${startDateRaw})::date <= (CURRENT_DATE - INTERVAL '7 days')
        )::int`,
      })
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), isNull(sessions.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      upcoming: Number(row?.upcoming ?? 0),
      completed: Number(row?.completed ?? 0),
      cancelled: Number(row?.cancelled ?? 0),
      totalEnrolled: Number(row?.totalEnrolled ?? 0),
      totalCapacity: Number(row?.totalCapacity ?? 0),
      totalClasses: Number(row?.totalClasses ?? 0),
      sessionsThisWeek: Number(row?.sessionsThisWeek ?? 0),
      sessionsLastWeek: Number(row?.sessionsLastWeek ?? 0),
    };
  });
}
