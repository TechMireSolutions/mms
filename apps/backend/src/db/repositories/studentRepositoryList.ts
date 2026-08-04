import { and, eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import {
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type Student,
  type StudentsCommandMetricsSnapshot,
  type StudentsListPageResult,
  type StudentsListQuery,
} from '@mms/shared';
import { students } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { studentRowToRecord } from './studentRepository.js';

const STUDENT_SORT_FIELDS = new Set([
  'name',
  'grNumber',
  'status',
  'gender',
  'registeredDate',
  'studentId',
  'updatedAt',
]);

function statusExpr(): SQL {
  return sql`lower(trim(COALESCE(${students.customData}->>'status', 'active')))`;
}

function genderExpr(): SQL {
  return sql`lower(trim(COALESCE(${students.customData}->>'gender', '')))`;
}

function buildSearchSql(search: string): SQL | null {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  return sql`(
    lower(COALESCE(${students.customData}->>'name', '')) LIKE ${pattern}
    OR lower(COALESCE(${students.customData}->>'grNumber', '')) LIKE ${pattern}
    OR lower(COALESCE(${students.customData}->>'studentId', '')) LIKE ${pattern}
    OR COALESCE(${students.customData}->>'cnic', '') LIKE ${pattern}
    OR lower(COALESCE(${students.customData}->>'fatherName', '')) LIKE ${pattern}
    OR lower(COALESCE(${students.customData}->>'guardianName', '')) LIKE ${pattern}
    OR EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = ${students.contactId}
        AND (
          lower(concat_ws(' ', c.custom_data->>'firstName', c.custom_data->>'lastName')) LIKE ${pattern}
          OR lower(COALESCE(c.custom_data->>'firstName', '')) LIKE ${pattern}
          OR lower(COALESCE(c.custom_data->>'lastName', '')) LIKE ${pattern}
        )
    )
  )`;
}

function buildOrderBy(sortField: string | undefined, sortDir: 'asc' | 'desc' | undefined): SQL {
  const dir = sortDir === 'desc' ? 'desc' : 'asc';
  const field = sortField?.trim();
  if (!field || !STUDENT_SORT_FIELDS.has(field)) {
    return sql`${students.id} asc`;
  }
  if (field === 'updatedAt') {
    return dir === 'desc'
      ? sql`${students.updatedAt} desc nulls last`
      : sql`${students.updatedAt} asc nulls last`;
  }
  return dir === 'desc'
    ? sql`${students.customData}->>${field} desc nulls last`
    : sql`${students.customData}->>${field} asc nulls last`;
}

function buildListConditions(
  subdomain: string,
  query: StudentsListQuery,
): SQL[] {
  const conditions: SQL[] = [eq(students.workspaceSubdomain, subdomain)];

  if (query.includeDeleted) {
    conditions.push(isNotNull(students.deletedAt));
  } else {
    conditions.push(isNull(students.deletedAt));
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

  if (query.gender?.trim()) {
    const genderFilter = query.gender.trim().toLowerCase();
    conditions.push(sql`${genderExpr()} = ${genderFilter}`);
  }

  const search = query.search?.trim();
  if (search) {
    const searchSql = buildSearchSql(search);
    if (searchSql) conditions.push(searchSql);
  }

  return conditions;
}

/**
 * SQL-filtered students Work list page (typed deleted_at + JSONB filters).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listStudentsPage(
  tenant: string,
  query: StudentsListQuery,
): Promise<StudentsListPageResult> {
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
      .from(students)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      students: rows.map((row) => studentRowToRecord(row as never)) as Student[],
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function countStudentsActive(tenant: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)));
    return Number(rows[0]?.count ?? 0);
  });
}

/** SQL aggregates for Students command-centre metrics (active rows only). */
export async function aggregateStudentsCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<StudentsCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const registeredRaw = sql`NULLIF(trim(COALESCE(
      ${students.customData}->>'registeredDate',
      ${students.customData}->>'createdAt',
      ''
    )), '')`;

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'active')::int`,
        inactive: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'inactive')::int`,
        suspended: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'suspended')::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${registeredRaw} IS NOT NULL
          AND ${registeredRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${registeredRaw})::timestamptz
            >= (NOW() - (${periodDays} * INTERVAL '1 day'))
        )::int`,
      })
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      suspended: Number(row?.suspended ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
    };
  });
}
