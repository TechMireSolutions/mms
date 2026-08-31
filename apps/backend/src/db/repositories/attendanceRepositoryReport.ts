import { sql } from 'drizzle-orm';
import {
  EMPTY_ATTENDANCE_REPORT_AGGREGATES,
  attendanceReportComparisonQueryActive,
  ensureAllSessionsInComparison,
  type AttendanceReportAggregates,
  type AttendanceReportComparison,
  type AttendanceReportComparisonMonth,
  type AttendanceReportComparisonQuery,
  type AttendanceReportComparisonSession,
} from '@mms/shared';
import { getQueryRows } from '../documentStoreKeys.js';
import { withTenant } from '../tenant-context.js';

function activeAttendanceWhere(subdomain: string, alias = 'a'): ReturnType<typeof sql> {
  return sql`
    ${sql.raw(`${alias}.workspace_subdomain`)} = ${subdomain}
    AND ${sql.raw(`${alias}.deleted_at`)} IS NULL
  `;
}

function isPresentOrLateSql(alias = 'a'): ReturnType<typeof sql> {
  return sql`lower(trim(${sql.raw(`${alias}.status`)})) IN ('present', 'late')`;
}

/** Attendance report aggregates for ComparisonMode (session attendancePct + dual monthly ranges). */
export async function loadAttendanceReportAggregatesSql(
  tenant: string,
  comparisonQuery?: AttendanceReportComparisonQuery,
): Promise<AttendanceReportAggregates> {
  const subdomain = tenant.trim().toLowerCase();
  if (!subdomain) return { ...EMPTY_ATTENDANCE_REPORT_AGGREGATES };

  return withTenant(subdomain, async (tx) => {
    const aggregates: AttendanceReportAggregates = { ...EMPTY_ATTENDANCE_REPORT_AGGREGATES };
    if (!attendanceReportComparisonQueryActive(comparisonQuery) || !comparisonQuery) {
      return aggregates;
    }

    const comparison: AttendanceReportComparison = {
      sessions: [],
      monthly: { a: [], b: [] },
    };

    const sessionIds = comparisonQuery.sessionIds ?? [];
    if (sessionIds.length > 0) {
      const presentOrLate = isPresentOrLateSql('a');
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
        session_classes AS (
          SELECT
            sel."sessionId",
            sc.id AS "classId"
          FROM selected sel
          INNER JOIN session_classes sc
            ON sc.workspace_subdomain = ${subdomain}
            AND sc.session_id = sel."sessionId"
        )
        SELECT
          sc."sessionId" AS "sessionId",
          COALESCE(
            ROUND(
              (
                100.0
                * COUNT(a.id) FILTER (WHERE ${presentOrLate})
              ) / NULLIF(COUNT(a.id), 0)
            ),
            0
          )::int AS "attendancePct"
        FROM session_classes sc
        LEFT JOIN attendance a
          ON ${activeAttendanceWhere(subdomain, 'a')}
          AND sc."classId" IS NOT NULL
          AND a.class_id = sc."classId"
        GROUP BY sc."sessionId"
      `);

      comparison.sessions = ensureAllSessionsInComparison(
        getQueryRows<Record<string, unknown>>(compareSessionResult).map((row) => ({
          sessionId: String(row.sessionId ?? ''),
          attendancePct: Number(row.attendancePct ?? 0),
        } satisfies AttendanceReportComparisonSession)),
        sessionIds,
        (sessionId) => ({ sessionId, attendancePct: 0 }),
      );
    }

    const loadMonthlyRange = async (
      from: string | undefined,
      to: string | undefined,
    ): Promise<AttendanceReportComparisonMonth[]> => {
      if (!from || !to) return [];
      const presentOrLate = isPresentOrLateSql('a');
      const monthResult = await tx.execute(sql`
        SELECT
          to_char(left(a.date, 10)::date, 'YYYY-MM') AS "monthKey",
          COUNT(*) FILTER (WHERE ${presentOrLate})::int AS "presentCount",
          COUNT(*)::int AS total
        FROM attendance a
        WHERE ${activeAttendanceWhere(subdomain, 'a')}
          AND a.date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND left(a.date, 10) >= ${from}
          AND left(a.date, 10) <= ${to}
        GROUP BY 1
        ORDER BY 1 ASC
      `);
      return getQueryRows<Record<string, unknown>>(monthResult)
        .filter((row) => typeof row.monthKey === 'string' && /^\d{4}-\d{2}$/.test(row.monthKey))
        .map((row) => ({
          monthKey: String(row.monthKey),
          presentCount: Number(row.presentCount ?? 0),
          total: Number(row.total ?? 0),
        }));
    };

    comparison.monthly.a = await loadMonthlyRange(comparisonQuery.rangeAFrom, comparisonQuery.rangeATo);
    comparison.monthly.b = await loadMonthlyRange(comparisonQuery.rangeBFrom, comparisonQuery.rangeBTo);
    aggregates.comparison = comparison;
    return aggregates;
  });
}
