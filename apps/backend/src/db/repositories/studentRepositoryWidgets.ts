import { and, eq, isNull, ne, sql, type SQL } from 'drizzle-orm';
import type {
  StudentsWidgetAggregateResult,
  StudentsWidgetQuery,
} from '@mms/shared';
import { students } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

const customDataSql = sql.raw('"students"."custom_data"');

function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt))!;
}

function singleFilterSql(
  field: string | undefined,
  operator: StudentsWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const safeField = sql.raw(`'${trimmedField.replace(/[^a-zA-Z0-9_]/g, '')}'`);
  const op = operator ?? 'equals';
  if (op === 'equals') {
    return sql`lower(trim(COALESCE(${customDataSql}->>${safeField}, ''))) = ${value.trim().toLowerCase()}`;
  }
  if (op === 'contains') {
    return sql`lower(COALESCE(${customDataSql}->>${safeField}, '')) LIKE ${`%${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(${customDataSql}->>${safeField}, '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(${customDataSql}->>${safeField}, '')::numeric < ${Number(value)}`;
  }
  return null;
}

function widgetFilterSql(query: StudentsWidgetQuery): SQL | null {
  const clauses: SQL[] = [];
  const legacy = singleFilterSql(query.filterField, query.filterOperator, query.filterValue);
  if (legacy) clauses.push(legacy);
  for (const rule of query.filters ?? []) {
    const clause = singleFilterSql(rule.field, rule.operator, rule.value);
    if (clause) clauses.push(clause);
  }
  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0]!;
  return sql`(${sql.join(clauses, sql` AND `)})`;
}

function resolveChartLimit(query: StudentsWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}

/** SQL widget aggregates for students (Contacts parity). */
export async function aggregateStudentsWidgetQueries(
  tenant: string,
  queries: StudentsWidgetQuery[],
): Promise<Record<string, StudentsWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, StudentsWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenantTransaction(subdomain, async (tx) => {
    const totalRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(activeWorkspaceWhere(subdomain));
    const totalCount = Number(totalRows[0]?.count ?? 0);

    for (const query of queries) {
      const filterSql = widgetFilterSql(query);
      const whereClause = filterSql
        ? and(activeWorkspaceWhere(subdomain), filterSql)
        : activeWorkspaceWhere(subdomain);
      const chartLimit = resolveChartLimit(query);

      let value = 0;
      if (query.operation === 'count' || query.operation === 'percentage') {
        const countRows = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(whereClause);
        const filteredCount = Number(countRows[0]?.count ?? 0);
        value =
          query.operation === 'percentage'
            ? totalCount > 0
              ? Math.round((filteredCount / totalCount) * 100)
              : 0
            : filteredCount;
      } else if (query.operation === 'sum' || query.operation === 'avg') {
        const target = query.targetField?.trim() || '';
        if (target) {
          const safeTarget = sql.raw(`'${target.replace(/[^a-zA-Z0-9_]/g, '')}'`);
          const aggRows = await tx
            .select({
              sum: sql<number>`coalesce(sum(NULLIF(${customDataSql}->>${safeTarget}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${customDataSql}->>${safeTarget}, '') IS NOT NULL)::int`,
            })
            .from(students)
            .where(whereClause);
          const sum = Number(aggRows[0]?.sum ?? 0);
          const count = Number(aggRows[0]?.count ?? 0);
          value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
        }
      }

      const xAxis = query.xAxisField?.trim() || 'status';
      const safeXAxis = sql.raw(`'${xAxis.replace(/[^a-zA-Z0-9_]/g, '')}'`);
      const groupExpr = sql<string>`COALESCE(NULLIF(trim(${customDataSql}->>${safeXAxis}), ''), 'Unknown')`;

      const chartRows = await tx
        .select({
          name: groupExpr,
          value: sql<number>`count(*)::int`,
        })
        .from(students)
        .where(whereClause)
        .groupBy(groupExpr)
        .orderBy(sql`count(*) desc`)
        .limit(chartLimit);

      let chartData = chartRows.map((row) => ({
        name: row.name,
        value: Number(row.value ?? 0),
      }));

      if (query.operation === 'sum' || query.operation === 'avg') {
        const target = query.targetField?.trim() || '';
        if (target) {
          const safeTarget = sql.raw(`'${target.replace(/[^a-zA-Z0-9_]/g, '')}'`);
          const numericChart = await tx
            .select({
              name: groupExpr,
              sum: sql<number>`coalesce(sum(NULLIF(${customDataSql}->>${safeTarget}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${customDataSql}->>${safeTarget}, '') IS NOT NULL)::int`,
            })
            .from(students)
            .where(whereClause)
            .groupBy(groupExpr)
            .limit(chartLimit);
          chartData = numericChart
            .map((row) => {
              const sum = Number(row.sum ?? 0);
              const count = Number(row.count ?? 0);
              return {
                name: row.name,
                value: query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0,
              };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, chartLimit);
        }
      }

      results[query.id] = { value, totalCount, chartData };
    }

    return results;
  });
}

export async function listStudentLinkedContactIdsSql(
  tenant: string,
  excludeStudentId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const conditions: SQL[] = [eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)];
    if (excludeStudentId?.trim()) {
      conditions.push(ne(students.id, excludeStudentId.trim()));
    }
    const rows = await tx
      .select({
        contactId: students.contactId,
      })
      .from(students)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}

export async function countStudentsForNextGrNumber(
  tenant: string,
  regDate: string,
  restartAnnually: boolean,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  return withTenantTransaction(subdomain, async (tx) => {
    const base = and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt));
    if (!restartAnnually) {
      const rows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(base);
      return Number(rows[0]?.count ?? 0);
    }
    const yearStr = String(year);
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(
        and(
          base,
          sql`(
            COALESCE(${students.customData}->>'registeredDate', '') LIKE ${`${yearStr}%`}
            OR COALESCE(${students.customData}->>'grNumber', '') LIKE ${`%${yearStr}%`}
          )`,
        ),
      );
    return Number(rows[0]?.count ?? 0);
  });
}

export async function findStudentRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    email?: string;
    name?: string;
    dob?: string;
  },
): Promise<'contact' | 'email' | 'nameDob' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(students.workspaceSubdomain, subdomain),
      isNull(students.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(students.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            eq(students.contactId, contactId),
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const email = input.email?.trim().toLowerCase();
    if (email) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`lower(trim(COALESCE(${students.customData}->>'email', ''))) = ${email}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'email';
    }

    const name = input.name?.trim().toLowerCase();
    const dob = input.dob?.trim();
    if (name && dob) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`lower(trim(COALESCE(${students.customData}->>'name', ''))) = ${name}`,
            sql`NULLIF(trim(${students.customData}->>'dob'), '') = ${dob}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'nameDob';
    }

    return null;
  });
}
