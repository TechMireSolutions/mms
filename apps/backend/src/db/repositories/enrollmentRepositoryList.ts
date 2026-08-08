import { and, eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type Enrollment,
  type EnrollmentsCommandMetricsSnapshot,
  type EnrollmentsListPageResult,
  type EnrollmentsListQuery,
} from '@mms/shared';
import { enrollments } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { enrollmentRowToRecord } from './enrollmentRepository.js';

const ENROLLMENT_SORT_FIELDS = new Set([
  'studentName',
  'sessionName',
  'className',
  'status',
  'enrolledDate',
  'finalFee',
  'updatedAt',
]);

function statusExpr(): SQL {
  return sql`lower(trim(COALESCE(${enrollments.customData}->>'status', '')))`;
}

function studentNameExpr(): SQL {
  return sql`lower(trim(COALESCE(${enrollments.customData}->>'studentName', '')))`;
}

function sessionNameExpr(): SQL {
  return sql`lower(trim(COALESCE(${enrollments.customData}->>'sessionName', '')))`;
}

function classNameExpr(): SQL {
  return sql`lower(trim(COALESCE(${enrollments.customData}->>'className', '')))`;
}

function enrolledDateExpr(): SQL {
  return sql`NULLIF(trim(COALESCE(${enrollments.customData}->>'enrolledDate', '')), '')`;
}

function finalFeeExpr(): SQL {
  return sql`COALESCE((${enrollments.customData}->>'finalFee')::numeric, 0)`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    ${studentNameExpr()} LIKE ${pattern}
    OR ${sessionNameExpr()} LIKE ${pattern}
    OR ${classNameExpr()} LIKE ${pattern}
  )`;
}

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !ENROLLMENT_SORT_FIELDS.has(field)) {
    return sql`${enrollments.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${enrollments.updatedAt} desc nulls last`
      : sql`${enrollments.updatedAt} asc nulls last`;
  }
  if (field === 'studentName') {
    const sort = studentNameExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  if (field === 'sessionName') {
    const sort = sessionNameExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  if (field === 'className') {
    const sort = classNameExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  if (field === 'status') {
    const sort = statusExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  if (field === 'enrolledDate') {
    const sort = enrolledDateExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  if (field === 'finalFee') {
    const sort = finalFeeExpr();
    return dir === 'desc' ? sql`${sort} desc nulls last` : sql`${sort} asc nulls last`;
  }
  return dir === 'desc'
    ? sql`${enrollments.customData}->>${field} desc nulls last`
    : sql`${enrollments.customData}->>${field} asc nulls last`;
}

function buildListConditions(subdomain: string, query: EnrollmentsListQuery): SQL[] {
  const conditions: SQL[] = [eq(enrollments.workspaceSubdomain, subdomain)];

  if (query.includeDeleted) {
    conditions.push(isNotNull(enrollments.deletedAt));
  } else {
    conditions.push(isNull(enrollments.deletedAt));
  }

  if (query.status?.trim() && query.status !== 'all') {
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

  if (query.sessionId?.trim() && query.sessionId !== 'all') {
    const sessionId = query.sessionId.trim();
    conditions.push(sql`trim(COALESCE(${enrollments.customData}->>'sessionId', '')) = ${sessionId}`);
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}

/**
 * SQL-filtered enrollments Work list page (typed deleted_at + JSONB filters).
 * includeDeleted → deleted-only (Work trash parity).
 */
export async function listEnrollmentsPage(
  tenant: string,
  query: EnrollmentsListQuery,
): Promise<EnrollmentsListPageResult> {
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
      .from(enrollments)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(enrollments)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      enrollments: rows.map((row) => enrollmentRowToRecord(row as never)) as Enrollment[],
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function countEnrollmentsActive(tenant: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(and(eq(enrollments.workspaceSubdomain, subdomain), isNull(enrollments.deletedAt)));
    return Number(rows[0]?.count ?? 0);
  });
}

/** SQL aggregates for Enrollments command-centre metrics (active rows only). */
export async function aggregateEnrollmentsCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<EnrollmentsCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  const days = Math.max(1, periodDays);
  return withTenantTransaction(subdomain, async (tx) => {
    const enrolledDateRaw = enrolledDateExpr();

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        confirmed: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'confirmed')::int`,
        pending: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'pending')::int`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'cancelled')::int`,
        completed: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'completed')::int`,
        revenue: sql<number>`coalesce(sum(${finalFeeExpr()}) FILTER (WHERE ${statusExpr()} <> 'cancelled'), 0)::float8`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${enrolledDateRaw} IS NOT NULL
          AND ${enrolledDateRaw} ~ '^[0-9]{4}'
          AND (${enrolledDateRaw})::timestamptz >= (CURRENT_TIMESTAMP - (${days}::int * INTERVAL '1 day'))
        )::int`,
      })
      .from(enrollments)
      .where(and(eq(enrollments.workspaceSubdomain, subdomain), isNull(enrollments.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      confirmed: Number(row?.confirmed ?? 0),
      pending: Number(row?.pending ?? 0),
      cancelled: Number(row?.cancelled ?? 0),
      completed: Number(row?.completed ?? 0),
      revenue: Number(row?.revenue ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
    };
  });
}
