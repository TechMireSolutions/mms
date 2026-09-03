import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type {
  TeachersWidgetAggregateResult,
  TeachersWidgetQuery,
} from '@mms/shared';
import { teachers, contacts } from '../schema.js';
import { withTenant } from '../tenant-context.js';

function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt))!;
}

function resolveTeacherFieldExpr(field: string): SQL {
  const f = field.trim();
  if (f === 'status') return sql`COALESCE(${teachers.status}, 'active')`;
  if (f === 'employeeId' || f === 'employee_id') return sql`COALESCE(${teachers.employeeId}, '')`;
  if (f === 'specialization') return sql`COALESCE(${teachers.specialization}, '')`;
  if (f === 'qualification') return sql`COALESCE(${teachers.qualification}, '')`;
  if (f === 'joinDate' || f === 'join_date') return sql`COALESCE(${teachers.joinDate}, '')`;
  if (f === 'notes') return sql`COALESCE(${teachers.notes}, '')`;

  // Linked contact fields
  if (f === 'gender') {
    return sql`COALESCE((SELECT c.gender FROM ${contacts} c WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain} AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'dob') {
    return sql`COALESCE((SELECT c.dob FROM ${contacts} c WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain} AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'city') {
    return sql`COALESCE((SELECT c.city FROM ${contacts} c WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain} AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }
  if (f === 'name') {
    return sql`COALESCE((SELECT COALESCE(NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''), c.name) FROM ${contacts} c WHERE c.workspace_subdomain = ${teachers.workspaceSubdomain} AND c.id = ${teachers.contactId} LIMIT 1), '')`;
  }

  return sql`''`;
}

function singleFilterSql(
  field: string | undefined,
  operator: TeachersWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const fieldExpr = resolveTeacherFieldExpr(trimmedField);
  const op = operator ?? 'equals';
  const valNormalized = value.trim().toLowerCase();

  if (op === 'equals') {
    return sql`lower(trim(${fieldExpr}::text)) = ${valNormalized}`;
  }
  if (op === 'contains') {
    return sql`lower(${fieldExpr}::text) LIKE ${`%${valNormalized}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(trim(${fieldExpr}::text), '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(trim(${fieldExpr}::text), '')::numeric < ${Number(value)}`;
  }
  return null;
}

function widgetFilterSql(query: TeachersWidgetQuery): SQL | null {
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

function resolveChartLimit(query: TeachersWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}

/** SQL widget aggregates for teachers (Students parity — no full-collection dump). */
export async function aggregateTeachersWidgetQueries(
  tenant: string,
  queries: TeachersWidgetQuery[],
): Promise<Record<string, TeachersWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, TeachersWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenant(subdomain, async (tx) => {
    const totalRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(activeWorkspaceWhere(subdomain));
    const totalCount = Number(totalRows[0]?.count ?? 0);

    const queryResults = await Promise.all(
      queries.map(async (query) => {
        const filterSql = widgetFilterSql(query);
        const whereClause = filterSql
          ? and(activeWorkspaceWhere(subdomain), filterSql)
          : activeWorkspaceWhere(subdomain);
        const chartLimit = resolveChartLimit(query);

        let value = 0;
        if (query.operation === 'count' || query.operation === 'percentage') {
          const countRows = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(teachers)
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
            const targetExpr = resolveTeacherFieldExpr(target);
            const aggRows = await tx
              .select({
                sum: sql<number>`coalesce(sum(NULLIF(trim(${targetExpr}::text), '')::numeric), 0)`,
                count: sql<number>`count(*) FILTER (WHERE NULLIF(trim(${targetExpr}::text), '') IS NOT NULL)::int`,
              })
              .from(teachers)
              .where(whereClause);
            const sum = Number(aggRows[0]?.sum ?? 0);
            const count = Number(aggRows[0]?.count ?? 0);
            value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
          }
        }

        const xAxis = query.xAxisField?.trim() || 'status';
        const xAxisExpr = resolveTeacherFieldExpr(xAxis);
        const groupExpr = sql<string>`COALESCE(NULLIF(trim(${xAxisExpr}::text), ''), 'Unknown')`;

        const chartRows = await tx
          .select({
            name: groupExpr,
            value: sql<number>`count(*)::int`,
          })
          .from(teachers)
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
            const targetExpr = resolveTeacherFieldExpr(target);
            const numericChart = await tx
              .select({
                name: groupExpr,
                sum: sql<number>`coalesce(sum(NULLIF(trim(${targetExpr}::text), '')::numeric), 0)`,
                count: sql<number>`count(*) FILTER (WHERE NULLIF(trim(${targetExpr}::text), '') IS NOT NULL)::int`,
              })
              .from(teachers)
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

        return { id: query.id, result: { value, totalCount, chartData } };
      }),
    );

    for (const { id, result } of queryResults) {
      results[id] = result;
    }

    return results;
  });
}
