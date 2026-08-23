import { sql } from 'drizzle-orm';
import {
  EMPTY_FINANCE_REPORT_AGGREGATES,
  financeReportComparisonQueryActive,
  type FinanceReportAggregates,
  type FinanceReportComparison,
  type FinanceReportComparisonMonth,
  type FinanceReportComparisonQuery,
  type FinanceReportComparisonSession,
} from '@mms/shared';
import { getQueryRows } from '../documentStoreKeys.js';
import { withTenant } from '../tenant-context.js';

/**
 * Collected amount SQL — mirrors `getCollectedAmountForInvoice`:
 * paid → finalAmt; partial → paidAmt or round(finalAmt/2); else 0.
 */
function collectedAmountSql(alias = 'fi'): ReturnType<typeof sql> {
  const data = sql.raw(`${alias}.custom_data`);
  return sql`
    CASE
      WHEN lower(trim(COALESCE(${data}->>'status', ''))) = 'paid'
        THEN COALESCE(NULLIF(trim(${data}->>'finalAmt'), '')::numeric, 0)
      WHEN lower(trim(COALESCE(${data}->>'status', ''))) = 'partial'
        THEN COALESCE(
          NULLIF(trim(${data}->>'paidAmt'), '')::numeric,
          ROUND(COALESCE(NULLIF(trim(${data}->>'finalAmt'), '')::numeric, 0) / 2)
        )
      ELSE 0
    END
  `;
}

function activeInvoiceWhere(subdomain: string, alias = 'fi'): ReturnType<typeof sql> {
  const data = sql.raw(`${alias}.custom_data`);
  return sql`
    ${sql.raw(`${alias}.workspace_subdomain`)} = ${subdomain}
    AND NULLIF(trim(COALESCE(${data}->>'deletedAt', '')), '') IS NULL
  `;
}

/** Finance report aggregates for ComparisonMode (session feeCollected + dual monthly ranges). */
export async function loadFinanceReportAggregatesSql(
  tenant: string,
  comparisonQuery?: FinanceReportComparisonQuery,
): Promise<FinanceReportAggregates> {
  const subdomain = tenant.trim().toLowerCase();
  if (!subdomain) return { ...EMPTY_FINANCE_REPORT_AGGREGATES };

  return withTenant(subdomain, async (tx) => {
    const aggregates: FinanceReportAggregates = { ...EMPTY_FINANCE_REPORT_AGGREGATES };
    if (!financeReportComparisonQueryActive(comparisonQuery) || !comparisonQuery) {
      return aggregates;
    }

    const comparison: FinanceReportComparison = {
      sessions: [],
      monthly: { a: [], b: [] },
    };

    const sessionIds = comparisonQuery.sessionIds ?? [];
    if (sessionIds.length > 0) {
      const collected = collectedAmountSql('fi');
      const compareSessionResult = await tx.execute(sql`
        WITH selected AS (
          SELECT
            s.id AS "sessionId",
            NULLIF(trim(COALESCE(s.custom_data->>'name', '')), '') AS "sessionName"
          FROM sessions s
          WHERE s.workspace_subdomain = ${subdomain}
            AND s.deleted_at IS NULL
            AND s.id IN (${sql.join(
              sessionIds.map((id) => sql`${id}`),
              sql`, `,
            )})
        )
        SELECT
          sel."sessionId" AS "sessionId",
          COALESCE(SUM(${collected}), 0)::float8 AS "feeCollected"
        FROM selected sel
        LEFT JOIN finance_invoices fi
          ON ${activeInvoiceWhere(subdomain, 'fi')}
          AND (
            trim(COALESCE(fi.custom_data->>'session', '')) = sel."sessionId"
            OR (
              sel."sessionName" IS NOT NULL
              AND trim(COALESCE(fi.custom_data->>'session', '')) = sel."sessionName"
            )
          )
        GROUP BY sel."sessionId"
      `);

      comparison.sessions = getQueryRows<Record<string, unknown>>(compareSessionResult).map((row) => ({
        sessionId: String(row.sessionId ?? ''),
        feeCollected: Number(row.feeCollected ?? 0),
      } satisfies FinanceReportComparisonSession));

      for (const sessionId of sessionIds) {
        if (!comparison.sessions.some((row) => row.sessionId === sessionId)) {
          comparison.sessions.push({ sessionId, feeCollected: 0 });
        }
      }
    }

    const loadMonthlyRange = async (
      from: string | undefined,
      to: string | undefined,
    ): Promise<FinanceReportComparisonMonth[]> => {
      if (!from || !to) return [];
      const collected = collectedAmountSql('fi');
      const monthResult = await tx.execute(sql`
        SELECT
          to_char(left(NULLIF(trim(fi.custom_data->>'dueDate'), ''), 10)::date, 'YYYY-MM') AS "monthKey",
          COALESCE(SUM(${collected}), 0)::float8 AS collected
        FROM finance_invoices fi
        WHERE ${activeInvoiceWhere(subdomain, 'fi')}
          AND NULLIF(trim(fi.custom_data->>'dueDate'), '') IS NOT NULL
          AND NULLIF(trim(fi.custom_data->>'dueDate'), '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND left(NULLIF(trim(fi.custom_data->>'dueDate'), ''), 10) >= ${from}
          AND left(NULLIF(trim(fi.custom_data->>'dueDate'), ''), 10) <= ${to}
        GROUP BY 1
        ORDER BY 1 ASC
      `);
      return getQueryRows<Record<string, unknown>>(monthResult)
        .filter((row) => typeof row.monthKey === 'string' && /^\d{4}-\d{2}$/.test(row.monthKey))
        .map((row) => ({
          monthKey: String(row.monthKey),
          collected: Number(row.collected ?? 0),
        }));
    };

    comparison.monthly.a = await loadMonthlyRange(comparisonQuery.rangeAFrom, comparisonQuery.rangeATo);
    comparison.monthly.b = await loadMonthlyRange(comparisonQuery.rangeBFrom, comparisonQuery.rangeBTo);
    aggregates.comparison = comparison;
    return aggregates;
  });
}
