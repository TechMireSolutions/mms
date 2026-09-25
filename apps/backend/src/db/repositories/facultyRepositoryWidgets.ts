import { and, sql } from 'drizzle-orm';
import type {
  TeachersWidgetAggregateResult,
  TeachersWidgetQuery,
} from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import {
  activeWorkspaceWhere,
  resolveChartLimit,
  resolveTeacherFieldExpr,
  widgetFilterSql,
} from './facultyRepositoryWidgetFilters.js';

/** SQL widget aggregates for teachers (Students parity — no full-collection dump). */
export async function aggregateTeachersWidgetQueries(
  tenant: string,
  queries: TeachersWidgetQuery[],
): Promise<Record<string, TeachersWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, TeachersWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenantRead(subdomain, async (tx) => {
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

        // For sum/avg with a target the count-based chart is discarded by the
        // numeric chart, so only run the count chart for the other operations.
        const target =
          (query.operation === 'sum' || query.operation === 'avg')
            ? (query.targetField?.trim() || '')
            : '';

        let chartData: { name: string; value: number }[];
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
        } else {
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
          chartData = chartRows.map((row) => ({
            name: row.name,
            value: Number(row.value ?? 0),
          }));
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


export const aggregateFacultyWidgetQueries = aggregateTeachersWidgetQueries;
