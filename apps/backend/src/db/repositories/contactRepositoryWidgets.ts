import { and, sql, type SQL } from 'drizzle-orm';
import type {
  ContactsWidgetAggregateResult,
  ContactsWidgetQuery,
} from '@mms/shared';
import { contacts, contactPhones, contactEmails, contactAddresses } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { activeWorkspaceWhere } from './contactRepositoryAggregateHelpers.js';

function typedColumnExpr(field: string): SQL {
  switch (field) {
    case 'firstName':
      return sql`${contacts.firstName}`;
    case 'lastName':
      return sql`${contacts.lastName}`;
    case 'name':
      return sql`${contacts.name}`;
    case 'gender':
      return sql`${contacts.gender}`;
    case 'dob':
      return sql`${contacts.dob}`;
    case 'cnic':
      return sql`${contacts.cnic}`;
    case 'isSyed':
      return sql`${contacts.isSyed}::text`;
    case 'phone':
      return sql`(
        SELECT p.number FROM ${contactPhones} p
        WHERE p.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND p.contact_id = ${contacts.id}
        ORDER BY CASE WHEN p.is_primary THEN 0 ELSE 1 END, p.sort_order ASC
        LIMIT 1
      )`;
    case 'email':
      return sql`(
        SELECT e.address FROM ${contactEmails} e
        WHERE e.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND e.contact_id = ${contacts.id}
        ORDER BY CASE WHEN e.is_primary THEN 0 ELSE 1 END, e.id ASC
        LIMIT 1
      )`;
    case 'city':
      return sql`(
        SELECT a.city FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      )`;
    case 'state':
      return sql`(
        SELECT a.state FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      )`;
    case 'country':
      return sql`(
        SELECT a.country FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      )`;
    case 'whatsappStatus':
      return sql`${contacts.whatsappStatus}`;
    case 'preferredLanguage':
      return sql`${contacts.preferredLanguage}`;
    case 'preferredContactMethod':
      return sql`${contacts.preferredContactMethod}`;
    default:
      return sql`${contacts.name}`;
  }
}

function singleFilterSql(
  field: string | undefined,
  operator: ContactsWidgetQuery['filterOperator'],
  value: string | undefined,
): SQL | null {
  const trimmedField = field?.trim();
  if (!trimmedField || value == null || value === '') return null;
  const col = typedColumnExpr(trimmedField);
  const op = operator ?? 'equals';
  if (op === 'equals') {
    return sql`lower(trim(COALESCE(${col}, ''))) = ${value.trim().toLowerCase()}`;
  }
  if (op === 'contains') {
    return sql`lower(COALESCE(${col}, '')) LIKE ${`%${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'startsWith') {
    return sql`lower(COALESCE(${col}, '')) LIKE ${`${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(${col}, '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(${col}, '')::numeric < ${Number(value)}`;
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

/** SQL widget aggregates for contacts. */
export async function aggregateContactsWidgetQueries(
  tenant: string,
  queries: ContactsWidgetQuery[],
): Promise<Record<string, ContactsWidgetAggregateResult>> {
  const subdomain = tenant.trim().toLowerCase();
  const results: Record<string, ContactsWidgetAggregateResult> = {};
  if (queries.length === 0) return results;

  return withTenant(subdomain, async (tx) => {
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
          const col = typedColumnExpr(target);
          const aggRows = await tx
            .select({
              sum: sql<number>`coalesce(sum(NULLIF(${col}, '')::numeric), 0)`,
              count: sql<number>`count(*) FILTER (WHERE NULLIF(${col}, '') IS NOT NULL)::int`,
            })
            .from(contacts)
            .where(whereClause);
          const sum = Number(aggRows[0]?.sum ?? 0);
          const count = Number(aggRows[0]?.count ?? 0);
          value = query.operation === 'sum' ? sum : count > 0 ? Math.round(sum / count) : 0;
        }
      }

      const xAxis = query.xAxisField?.trim() || 'gender';
      const col = typedColumnExpr(xAxis);
      const groupExpr = sql<string>`COALESCE(NULLIF(trim(${col}), ''), 'Unknown')`;

      const chartRows = await tx
        .select({
          name: groupExpr,
          value: sql<number>`count(*)::int`,
        })
        .from(contacts)
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
          const targetCol = typedColumnExpr(target);
          const sumExpr = sql<number>`coalesce(sum(NULLIF(${targetCol}, '')::numeric), 0)`;
          const countExpr = sql<number>`count(*) FILTER (WHERE NULLIF(${targetCol}, '') IS NOT NULL)::int`;
          const orderExpr =
            query.operation === 'sum'
              ? sql`coalesce(sum(NULLIF(${targetCol}, '')::numeric), 0) desc`
              : sql`coalesce(sum(NULLIF(${targetCol}, '')::numeric) / NULLIF(count(*) FILTER (WHERE NULLIF(${targetCol}, '') IS NOT NULL), 0), 0) desc`;
          const numericChart = await tx
            .select({
              name: groupExpr,
              sum: sumExpr,
              count: countExpr,
            })
            .from(contacts)
            .where(whereClause)
            .groupBy(groupExpr)
            .orderBy(orderExpr)
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
            .slice(0, chartLimit);
        }
      }

      results[query.id] = { value, totalCount, chartData };
    }

    return results;
  });
}
