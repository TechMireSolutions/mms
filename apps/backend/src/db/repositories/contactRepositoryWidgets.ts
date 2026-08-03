import { and, sql, type SQL } from 'drizzle-orm';
import type {
  ContactsWidgetAggregateResult,
  ContactsWidgetQuery,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { activeWorkspaceWhere } from './contactRepositoryAggregateHelpers.js';

function singleFilterSql(
  field: string | undefined,
  operator: ContactsWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const op = operator ?? 'equals';
  if (op === 'equals') {
    return sql`lower(trim(COALESCE(${contacts.customData}->>${trimmedField}, ''))) = ${value.trim().toLowerCase()}`;
  }
  if (op === 'contains') {
    return sql`lower(COALESCE(${contacts.customData}->>${trimmedField}, '')) LIKE ${`%${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'startsWith') {
    return sql`lower(COALESCE(${contacts.customData}->>${trimmedField}, '')) LIKE ${`${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(${contacts.customData}->>${trimmedField}, '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(${contacts.customData}->>${trimmedField}, '')::numeric < ${Number(value)}`;
  }
  return null;
}

function widgetFilterSql(query: ContactsWidgetQuery): SQL | null {
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

function resolveChartLimit(query: ContactsWidgetQuery): number {
  const requested = query.chartLimit ?? 8;
  return Math.min(Math.max(requested, 1), 50);
}

export async function aggregateContactsWidgetQueries(
  tenant: string,
  queries: ContactsWidgetQuery[],
): Promise<Record<string, ContactsWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, ContactsWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenantTransaction(subdomain, async (tx) => {
    const totalRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
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
          .from(contacts)
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
          const aggRows = await tx
            .select({
              sum: sql<number>`coalesce(sum(NULLIF(${contacts.customData}->>${target}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${contacts.customData}->>${target}, '') IS NOT NULL)::int`,
            })
            .from(contacts)
            .where(whereClause);
          const sum = Number(aggRows[0]?.sum ?? 0);
          const count = Number(aggRows[0]?.count ?? 0);
          value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
        }
      }

      const xAxis = query.xAxisField?.trim() || 'gender';
      const chartRows = await tx
        .select({
          name: sql<string>`COALESCE(NULLIF(trim(${contacts.customData}->>${xAxis}), ''), 'Unknown')`,
          value: sql<number>`count(*)::int`,
        })
        .from(contacts)
        .where(whereClause)
        .groupBy(sql`COALESCE(NULLIF(trim(${contacts.customData}->>${xAxis}), ''), 'Unknown')`)
        .orderBy(sql`count(*) desc`)
        .limit(chartLimit);

      let chartData = chartRows.map((row) => ({
        name: row.name,
        value: Number(row.value ?? 0),
      }));

      if (query.operation === 'sum' || query.operation === 'avg') {
        const target = query.targetField?.trim() || '';
        if (target) {
          const numericChart = await tx
            .select({
              name: sql<string>`COALESCE(NULLIF(trim(${contacts.customData}->>${xAxis}), ''), 'Unknown')`,
              sum: sql<number>`coalesce(sum(NULLIF(${contacts.customData}->>${target}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${contacts.customData}->>${target}, '') IS NOT NULL)::int`,
            })
            .from(contacts)
            .where(whereClause)
            .groupBy(sql`COALESCE(NULLIF(trim(${contacts.customData}->>${xAxis}), ''), 'Unknown')`)
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
