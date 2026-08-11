import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type {
  SessionsWidgetAggregateResult,
  SessionsWidgetQuery,
} from '@mms/shared';
import { sessions } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { jsonbFieldKeyLiteral } from './jsonbFieldUsage.js';

const customDataSql = sql.raw('"sessions"."custom_data"');

function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(sessions.workspaceSubdomain, subdomain), isNull(sessions.deletedAt))!;
}

function singleFilterSql(
  field: string | undefined,
  operator: SessionsWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const safeField = jsonbFieldKeyLiteral(trimmedField);
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

function widgetFilterSql(query: SessionsWidgetQuery): SQL | null {
  return singleFilterSql(query.filterField, query.filterOperator, query.filterValue);
}

/** SQL widget aggregates for sessions (Teachers parity — no full-collection dump). */
export async function aggregateSessionsWidgetQueries(
  tenant: string,
  queries: SessionsWidgetQuery[],
): Promise<Record<string, SessionsWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, SessionsWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenantTransaction(subdomain, async (tx) => {
    const totalRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(activeWorkspaceWhere(subdomain));
    const totalCount = Number(totalRows[0]?.count ?? 0);

    for (const query of queries) {
      const filterSql = widgetFilterSql(query);
      const whereClause = filterSql
        ? and(activeWorkspaceWhere(subdomain), filterSql)
        : activeWorkspaceWhere(subdomain);
      const chartLimit = 8;

      let value = 0;
      if (query.operation === 'count' || query.operation === 'percentage') {
        const countRows = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(sessions)
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
          const safeTarget = jsonbFieldKeyLiteral(target);
          const aggRows = await tx
            .select({
              sum: sql<number>`coalesce(sum(NULLIF(${customDataSql}->>${safeTarget}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${customDataSql}->>${safeTarget}, '') IS NOT NULL)::int`,
            })
            .from(sessions)
            .where(whereClause);
          const sum = Number(aggRows[0]?.sum ?? 0);
          const count = Number(aggRows[0]?.count ?? 0);
          value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
        }
      }

      const xAxis = query.xAxisField?.trim() || 'status';
      const safeXAxis = jsonbFieldKeyLiteral(xAxis);
      const groupExpr = sql<string>`COALESCE(NULLIF(trim(${customDataSql}->>${safeXAxis}), ''), 'Unknown')`;

      const chartRows = await tx
        .select({
          name: groupExpr,
          value: sql<number>`count(*)::int`,
        })
        .from(sessions)
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
          const safeTarget = jsonbFieldKeyLiteral(target);
          const numericChart = await tx
            .select({
              name: groupExpr,
              sum: sql<number>`coalesce(sum(NULLIF(${customDataSql}->>${safeTarget}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${customDataSql}->>${safeTarget}, '') IS NOT NULL)::int`,
            })
            .from(sessions)
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
