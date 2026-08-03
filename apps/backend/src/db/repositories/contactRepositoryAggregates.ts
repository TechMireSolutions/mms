import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import {
  CONTACT_METRICS_DEFAULT_PERIOD_DAYS,
  formatContactsMonthLabels,
  isContactLockedEnabledTab,
  type ContactsCommandMetricsSnapshot,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetAggregateResult,
  type ContactsWidgetQuery,
  type FieldConfig,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import {
  contactFieldNonEmptySql,
  hasEmailSql,
  hasPhoneSql,
  hasWhatsAppSql,
} from './contactRepositorySql.js';

const LIST_TAB_DATA_KEYS: Record<string, string> = {
  phones: 'phones',
  emails: 'emails',
  addresses: 'addresses',
  socials: 'socials',
  relationship: 'relationshipContacts',
};

const COMPLETENESS_SKIP_TYPES = new Set(['boolean', 'ai_summary']);

function activeWorkspaceWhere(subdomain: string): SQL {
  return and(eq(contacts.workspaceSubdomain, subdomain), isNull(contacts.deletedAt))!;
}

function createdAtRawSql(): SQL {
  return sql`NULLIF(trim(COALESCE(${contacts.customData}->>'createdAt', '')), '')`;
}

/** True when required Setup fields/tabs are missing — mirrors `isContactProfileIncomplete`. */
export function buildProfileIncompleteSql(fieldConfig: FieldConfig): SQL | null {
  const fields = fieldConfig.fields || {};
  const formTabs = (fieldConfig.formTabs || []).filter(
    (tab) => tab.enabled !== false || isContactLockedEnabledTab(tab.key),
  );
  const requiredTabs = new Set(fieldConfig.requiredTabs || []);
  const missingClauses: SQL[] = [];

  for (const tab of formTabs) {
    const listKey = LIST_TAB_DATA_KEYS[tab.key];
    if (listKey) {
      if (!requiredTabs.has(tab.key)) continue;
      missingClauses.push(sql`(
        jsonb_typeof(${contacts.customData}->${listKey}) IS DISTINCT FROM 'array'
        OR jsonb_array_length(${contacts.customData}->${listKey}) = 0
      )`);
      continue;
    }
    const tabFields = (fields[tab.key] || []).filter(
      (field) => field.enabled && !COMPLETENESS_SKIP_TYPES.has(field.type) && field.required,
    );
    for (const field of tabFields) {
      missingClauses.push(sql`(NOT ${contactFieldNonEmptySql(field.key)})`);
    }
  }

  if (missingClauses.length === 0) return null;
  return sql`(${sql.join(missingClauses, sql` OR `)})`;
}

export async function aggregateContactsCommandMetrics(
  tenant: string,
  fieldConfig: FieldConfig,
  options?: { periodDays?: number; duplicatePairCount?: number },
): Promise<ContactsCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  const periodDays = options?.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  const incompleteSql = buildProfileIncompleteSql(fieldConfig);

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${createdAtRawSql()} IS NOT NULL
          AND (${contacts.customData}->>'createdAt')::timestamptz
            >= (NOW() - (${periodDays} * INTERVAL '1 day'))
        )::int`,
        whatsappCount: sql<number>`count(*) FILTER (WHERE ${hasWhatsAppSql()})::int`,
        incompleteCount: incompleteSql
          ? sql<number>`count(*) FILTER (WHERE ${incompleteSql})::int`
          : sql<number>`0::int`,
      })
      .from(contacts)
      .where(activeWorkspaceWhere(subdomain));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
      whatsappCount: Number(row?.whatsappCount ?? 0),
      incompleteCount: Number(row?.incompleteCount ?? 0),
      duplicatePairCount: options?.duplicatePairCount ?? 0,
    };
  });
}

export async function aggregateContactsReportAnalytics(
  tenant: string,
  options?: { periodDays?: number; referenceDate?: Date },
): Promise<ContactsReportAnalyticsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  const periodDays = options?.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  const referenceDate = options?.referenceDate ?? new Date();
  const refIso = referenceDate.toISOString();

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        whatsappCount: sql<number>`count(*) FILTER (WHERE ${hasWhatsAppSql()})::int`,
        missingInfoCount: sql<number>`count(*) FILTER (WHERE NOT ${hasPhoneSql()} OR NOT ${hasEmailSql()})::int`,
        newLast30Days: sql<number>`count(*) FILTER (WHERE
          ${createdAtRawSql()} IS NOT NULL
          AND (${contacts.customData}->>'createdAt')::timestamptz
            >= ((${refIso}::timestamptz) - INTERVAL '30 days')
        )::int`,
        newPrior30Days: sql<number>`count(*) FILTER (WHERE
          ${createdAtRawSql()} IS NOT NULL
          AND (${contacts.customData}->>'createdAt')::timestamptz
            >= ((${refIso}::timestamptz) - INTERVAL '60 days')
          AND (${contacts.customData}->>'createdAt')::timestamptz
            < ((${refIso}::timestamptz) - INTERVAL '30 days')
        )::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${createdAtRawSql()} IS NOT NULL
          AND (${contacts.customData}->>'createdAt')::timestamptz
            >= ((${refIso}::timestamptz) - (${periodDays} * INTERVAL '1 day'))
        )::int`,
        maxCreatedAt: sql<string | null>`max(NULLIF(trim(${contacts.customData}->>'createdAt'), ''))`,
        signupCount: sql<number>`count(*) FILTER (WHERE ${createdAtRawSql()} IS NOT NULL)::int`,
      })
      .from(contacts)
      .where(activeWorkspaceWhere(subdomain));

    const row = rows[0];
    const total = Number(row?.total ?? 0);
    const whatsappCount = Number(row?.whatsappCount ?? 0);
    const hasSignupDates = Number(row?.signupCount ?? 0) > 0;
    let growthRecentSignups30d = 0;
    let growthPriorSignups30d = 0;

    if (hasSignupDates && row?.maxCreatedAt) {
      const maxIso = new Date(row.maxCreatedAt).toISOString();
      const growthRows = await tx
        .select({
          recent: sql<number>`count(*) FILTER (WHERE
            ${createdAtRawSql()} IS NOT NULL
            AND (${contacts.customData}->>'createdAt')::timestamptz
              >= ((${maxIso}::timestamptz) - INTERVAL '30 days')
            AND (${contacts.customData}->>'createdAt')::timestamptz <= ${maxIso}::timestamptz
          )::int`,
          prior: sql<number>`count(*) FILTER (WHERE
            ${createdAtRawSql()} IS NOT NULL
            AND (${contacts.customData}->>'createdAt')::timestamptz
              >= ((${maxIso}::timestamptz) - INTERVAL '60 days')
            AND (${contacts.customData}->>'createdAt')::timestamptz
              < ((${maxIso}::timestamptz) - INTERVAL '30 days')
          )::int`,
        })
        .from(contacts)
        .where(activeWorkspaceWhere(subdomain));
      growthRecentSignups30d = Number(growthRows[0]?.recent ?? 0);
      growthPriorSignups30d = Number(growthRows[0]?.prior ?? 0);
    }

    return {
      total,
      activeCount: total,
      whatsappCount,
      whatsappRate: total > 0 ? Math.round((whatsappCount / total) * 100) : 0,
      missingInfoCount: Number(row?.missingInfoCount ?? 0),
      newLast30Days: Number(row?.newLast30Days ?? 0),
      newPrior30Days: Number(row?.newPrior30Days ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
      hasSignupDates,
      growthRecentSignups30d,
      growthPriorSignups30d,
    };
  });
}

export async function aggregateContactsMonthlyCreatedCounts(
  tenant: string,
  years: number[],
  monthCount = 6,
  language = 'en',
): Promise<ContactsMonthlyYearCounts[]> {
  if (years.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  const monthLabels = formatContactsMonthLabels(language, monthCount);

  return withTenantTransaction(subdomain, async (tx) => {
    const results: ContactsMonthlyYearCounts[] = [];
    for (const year of years) {
      const yearStr = String(year);
      const rows = await tx
        .select({
          month: sql<string>`substring(${contacts.customData}->>'createdAt' from 6 for 2)`,
          count: sql<number>`count(*)::int`,
        })
        .from(contacts)
        .where(
          and(
            activeWorkspaceWhere(subdomain),
            sql`${createdAtRawSql()} IS NOT NULL`,
            sql`${contacts.customData}->>'createdAt' LIKE ${`${yearStr}-%`}`,
          ),
        )
        .groupBy(sql`substring(${contacts.customData}->>'createdAt' from 6 for 2)`);

      const byMonth = new Map(
        rows.map((row) => [row.month, Number(row.count ?? 0)] as const),
      );
      results.push({
        year,
        months: Array.from({ length: monthCount }, (_, monthIndex) => {
          const monthStr = String(monthIndex + 1).padStart(2, '0');
          return {
            month: monthLabels[monthIndex] ?? monthStr,
            count: byMonth.get(monthStr) ?? 0,
          };
        }),
      });
    }
    return results;
  });
}

function widgetFilterSql(query: ContactsWidgetQuery): SQL | null {
  const field = query.filterField?.trim();
  if (!field || query.filterValue == null || query.filterValue === '') return null;
  const value = query.filterValue;
  const op = query.filterOperator ?? 'equals';
  if (op === 'equals') {
    return sql`lower(trim(COALESCE(${contacts.customData}->>${field}, ''))) = ${value.trim().toLowerCase()}`;
  }
  if (op === 'contains') {
    return sql`lower(COALESCE(${contacts.customData}->>${field}, '')) LIKE ${`%${value.trim().toLowerCase()}%`}`;
  }
  if (op === 'gt') {
    return sql`NULLIF(${contacts.customData}->>${field}, '')::numeric > ${Number(value)}`;
  }
  if (op === 'lt') {
    return sql`NULLIF(${contacts.customData}->>${field}, '')::numeric < ${Number(value)}`;
  }
  return null;
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
        .limit(8);

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
            .limit(8);
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
            .slice(0, 8);
        }
      }

      results[query.id] = { value, totalCount, chartData };
    }

    return results;
  });
}
