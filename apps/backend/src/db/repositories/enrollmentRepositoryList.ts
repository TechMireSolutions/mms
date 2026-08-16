import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import {
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type EnrollmentsCommandMetricsSnapshot,
  type EnrollmentsListPageResult,
  type EnrollmentsListQuery,
} from '@mms/shared';
import { enrollments, enrollmentTimelineEvents } from '../schema.js';
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

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !ENROLLMENT_SORT_FIELDS.has(field)) {
    return sql`${enrollments.id} asc`;
  }
  let column: SQL;
  switch (field) {
    case 'updatedAt':
      column = enrollments.updatedAt as unknown as SQL;
      break;
    case 'studentName':
      column = enrollments.studentName as unknown as SQL;
      break;
    case 'sessionName':
      column = enrollments.sessionName as unknown as SQL;
      break;
    case 'className':
      column = enrollments.className as unknown as SQL;
      break;
    case 'status':
      column = enrollments.status as unknown as SQL;
      break;
    case 'enrolledDate':
      column = enrollments.enrolledDate as unknown as SQL;
      break;
    case 'finalFee':
      column = enrollments.finalFee as unknown as SQL;
      break;
    default:
      column = enrollments.updatedAt as unknown as SQL;
  }
  return dir === 'desc' ? desc(column) : asc(column);
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
      .map((status) => status.trim())
      .filter(Boolean);
    if (statuses.length > 0) {
      conditions.push(inArray(enrollments.status, statuses));
    }
  }

  if (query.sessionId?.trim() && query.sessionId !== 'all') {
    conditions.push(eq(enrollments.sessionId, query.sessionId.trim()));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(enrollments.studentName, pattern),
        ilike(enrollments.sessionName, pattern),
        ilike(enrollments.className, pattern),
      ) as SQL,
    );
  }

  return conditions;
}

/**
 * SQL-filtered enrollments Work list page (typed 3NF columns).
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

    if (rows.length === 0) {
      return {
        enrollments: [],
        total,
        page,
        limit,
        hasMore: false,
      };
    }

    const timelineRows = (await tx
      .select()
      .from(enrollmentTimelineEvents)
      .where(
        and(
          eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain),
          inArray(enrollmentTimelineEvents.enrollmentId, rows.map((r) => r.id)),
        ),
      )) ?? [];

    const timelineMap = new Map<string, typeof enrollmentTimelineEvents.$inferSelect[]>();
    for (const t of timelineRows) {
      const arr = timelineMap.get(t.enrollmentId) ?? [];
      arr.push(t);
      timelineMap.set(t.enrollmentId, arr);
    }

    return {
      enrollments: rows.map((row) => enrollmentRowToRecord(row, timelineMap.get(row.id) ?? [])),
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
    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        confirmed: sql<number>`count(*) FILTER (WHERE ${enrollments.status} = 'confirmed')::int`,
        pending: sql<number>`count(*) FILTER (WHERE ${enrollments.status} = 'pending')::int`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${enrollments.status} = 'cancelled')::int`,
        completed: sql<number>`count(*) FILTER (WHERE ${enrollments.status} = 'completed')::int`,
        revenue: sql<number>`coalesce(sum(${enrollments.finalFee}::float8) FILTER (WHERE ${enrollments.status} <> 'cancelled'), 0)::float8`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${enrollments.enrolledDate} IS NOT NULL
          AND ${enrollments.enrolledDate} ~ '^[0-9]{4}'
          AND (${enrollments.enrolledDate})::timestamptz >= (CURRENT_TIMESTAMP - (${days}::int * INTERVAL '1 day'))
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
