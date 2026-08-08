import { sql } from 'drizzle-orm';
import {
  EMPTY_HASANAT_REPORT_AGGREGATES,
  hasanatReportComparisonQueryActive,
  type HasanatReportAggregates,
  type HasanatReportComparison,
  type HasanatReportComparisonMonth,
  type HasanatReportComparisonQuery,
  type HasanatReportComparisonSession,
} from '@mms/shared';
import { getQueryRows } from '../documentStoreKeys.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

function activeDistributionWhere(subdomain: string, alias = 'hd'): ReturnType<typeof sql> {
  const data = sql.raw(`${alias}.custom_data`);
  return sql`
    ${sql.raw(`${alias}.workspace_subdomain`)} = ${subdomain}
    AND NULLIF(trim(COALESCE(${data}->>'deletedAt', '')), '') IS NULL
  `;
}

/**
 * Points per distribution — mirrors `getDenominationPoints`:
 * configured denom points → legacy den1–den5 → name heuristics → 50; missing id → 0.
 */
function denominationPointsSql(hdAlias = 'hd', denAlias = 'den'): ReturnType<typeof sql> {
  const hd = sql.raw(`${hdAlias}.custom_data`);
  const den = sql.raw(`${denAlias}.custom_data`);
  return sql`
    CASE
      WHEN NULLIF(trim(COALESCE(${hd}->>'denominationId', '')), '') IS NULL THEN 0
      WHEN NULLIF(trim(COALESCE(${den}->>'points', '')), '') IS NOT NULL
        THEN COALESCE(NULLIF(trim(${den}->>'points'), '')::numeric, 0)
      WHEN trim(COALESCE(${hd}->>'denominationId', '')) = 'den1' THEN 50
      WHEN trim(COALESCE(${hd}->>'denominationId', '')) = 'den2' THEN 150
      WHEN trim(COALESCE(${hd}->>'denominationId', '')) = 'den3' THEN 500
      WHEN trim(COALESCE(${hd}->>'denominationId', '')) = 'den4' THEN 1000
      WHEN trim(COALESCE(${hd}->>'denominationId', '')) = 'den5' THEN 2500
      WHEN lower(trim(COALESCE(
        NULLIF(trim(${hd}->>'denominationName'), ''),
        NULLIF(trim(${den}->>'name'), ''),
        ''
      ))) LIKE '%silver%' THEN 150
      WHEN lower(trim(COALESCE(
        NULLIF(trim(${hd}->>'denominationName'), ''),
        NULLIF(trim(${den}->>'name'), ''),
        ''
      ))) LIKE '%gold%' THEN 500
      WHEN lower(trim(COALESCE(
        NULLIF(trim(${hd}->>'denominationName'), ''),
        NULLIF(trim(${den}->>'name'), ''),
        ''
      ))) LIKE '%platinum%' THEN 1000
      WHEN lower(trim(COALESCE(
        NULLIF(trim(${hd}->>'denominationName'), ''),
        NULLIF(trim(${den}->>'name'), ''),
        ''
      ))) LIKE '%diamond%' THEN 2500
      ELSE 50
    END
  `;
}

function distributionQuantitySql(alias = 'hd'): ReturnType<typeof sql> {
  const data = sql.raw(`${alias}.custom_data`);
  return sql`COALESCE(NULLIF(trim(${data}->>'quantity'), '')::numeric, 1)`;
}

/** Hasanat report aggregates for ComparisonMode (session points + dual monthly ranges). */
export async function loadHasanatReportAggregatesSql(
  tenant: string,
  comparisonQuery?: HasanatReportComparisonQuery,
): Promise<HasanatReportAggregates> {
  const subdomain = tenant.trim().toLowerCase();
  if (!subdomain) return { ...EMPTY_HASANAT_REPORT_AGGREGATES };

  return withTenantTransaction(subdomain, async (tx) => {
    const aggregates: HasanatReportAggregates = { ...EMPTY_HASANAT_REPORT_AGGREGATES };
    if (!hasanatReportComparisonQueryActive(comparisonQuery) || !comparisonQuery) {
      return aggregates;
    }

    const comparison: HasanatReportComparison = {
      sessions: [],
      monthly: { a: [], b: [] },
    };

    const sessionIds = comparisonQuery.sessionIds ?? [];
    if (sessionIds.length > 0) {
      const pointsExpr = denominationPointsSql('hd', 'den');
      const quantityExpr = distributionQuantitySql('hd');
      const compareSessionResult = await tx.execute(sql`
        WITH selected AS (
          SELECT s.id AS "sessionId"
          FROM sessions s
          WHERE s.workspace_subdomain = ${subdomain}
            AND s.deleted_at IS NULL
            AND s.id IN (${sql.join(
              sessionIds.map((id) => sql`${id}`),
              sql`, `,
            )})
        ),
        session_students AS (
          SELECT DISTINCT
            sel."sessionId",
            NULLIF(trim(COALESCE(e.custom_data->>'studentId', '')), '') AS "studentId"
          FROM selected sel
          INNER JOIN enrollments e
            ON e.workspace_subdomain = ${subdomain}
            AND e.deleted_at IS NULL
            AND lower(trim(COALESCE(e.custom_data->>'status', ''))) <> 'cancelled'
            AND trim(COALESCE(e.custom_data->>'sessionId', '')) = sel."sessionId"
        )
        SELECT
          ss."sessionId" AS "sessionId",
          COALESCE(SUM(${quantityExpr} * ${pointsExpr}), 0)::float8 AS hasanat
        FROM session_students ss
        LEFT JOIN hasanat_distributions hd
          ON ${activeDistributionWhere(subdomain, 'hd')}
          AND ss."studentId" IS NOT NULL
          AND trim(COALESCE(hd.custom_data->>'recipientStudentId', '')) = ss."studentId"
        LEFT JOIN hasanat_denoms den
          ON den.workspace_subdomain = ${subdomain}
          AND den.id = NULLIF(trim(COALESCE(hd.custom_data->>'denominationId', '')), '')
        GROUP BY ss."sessionId"
      `);

      comparison.sessions = getQueryRows<Record<string, unknown>>(compareSessionResult).map((row) => ({
        sessionId: String(row.sessionId ?? ''),
        hasanat: Number(row.hasanat ?? 0),
      } satisfies HasanatReportComparisonSession));

      for (const sessionId of sessionIds) {
        if (!comparison.sessions.some((row) => row.sessionId === sessionId)) {
          comparison.sessions.push({ sessionId, hasanat: 0 });
        }
      }
    }

    const loadMonthlyRange = async (
      from: string | undefined,
      to: string | undefined,
    ): Promise<HasanatReportComparisonMonth[]> => {
      if (!from || !to) return [];
      const pointsExpr = denominationPointsSql('hd', 'den');
      const quantityExpr = distributionQuantitySql('hd');
      const monthResult = await tx.execute(sql`
        SELECT
          to_char(left(NULLIF(trim(hd.custom_data->>'issuedDate'), ''), 10)::date, 'YYYY-MM') AS "monthKey",
          COALESCE(SUM(${quantityExpr} * ${pointsExpr}), 0)::float8 AS points
        FROM hasanat_distributions hd
        LEFT JOIN hasanat_denoms den
          ON den.workspace_subdomain = ${subdomain}
          AND den.id = NULLIF(trim(COALESCE(hd.custom_data->>'denominationId', '')), '')
        WHERE ${activeDistributionWhere(subdomain, 'hd')}
          AND NULLIF(trim(hd.custom_data->>'issuedDate'), '') IS NOT NULL
          AND NULLIF(trim(hd.custom_data->>'issuedDate'), '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND left(NULLIF(trim(hd.custom_data->>'issuedDate'), ''), 10) >= ${from}
          AND left(NULLIF(trim(hd.custom_data->>'issuedDate'), ''), 10) <= ${to}
        GROUP BY 1
        ORDER BY 1 ASC
      `);
      return getQueryRows<Record<string, unknown>>(monthResult)
        .filter((row) => typeof row.monthKey === 'string' && /^\d{4}-\d{2}$/.test(row.monthKey))
        .map((row) => ({
          monthKey: String(row.monthKey),
          points: Number(row.points ?? 0),
        }));
    };

    comparison.monthly.a = await loadMonthlyRange(comparisonQuery.rangeAFrom, comparisonQuery.rangeATo);
    comparison.monthly.b = await loadMonthlyRange(comparisonQuery.rangeBFrom, comparisonQuery.rangeBTo);
    aggregates.comparison = comparison;
    return aggregates;
  });
}
