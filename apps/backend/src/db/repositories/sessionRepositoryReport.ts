import { sql } from 'drizzle-orm';
import type { SessionsReportAggregates } from '@mms/shared';
import { getQueryRows } from '../documentStoreKeys.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * SQL aggregates for Sessions Reports: capacity-by-class, enrollment trends, today's class rows.
 */
export async function loadSessionsReportAggregatesSql(
  tenant: string,
): Promise<SessionsReportAggregates> {
  const subdomain = tenant.trim().toLowerCase();
  const todayKey = WEEKDAY_KEYS[new Date().getDay()] ?? 'Mon';

  return withTenantTransaction(subdomain, async (tx) => {
    const capacityResult = await tx.execute(sql`
      SELECT
        s.id AS "sessionId",
        COALESCE(cls.value->>'id', '') AS "classId",
        COALESCE(s.custom_data->>'name', '') AS session,
        COALESCE(cls.value->>'name', '') AS class,
        COALESCE((cls.value->>'enrolled')::int, 0) AS enrolled,
        COALESCE((cls.value->>'capacity')::int, 0) AS capacity,
        CASE
          WHEN COALESCE((cls.value->>'capacity')::int, 0) > 0
            THEN ROUND(
              (COALESCE((cls.value->>'enrolled')::int, 0)::numeric
                / COALESCE((cls.value->>'capacity')::int, 0)::numeric) * 100
            )::int
          ELSE 0
        END AS rate,
        COALESCE(s.custom_data->>'status', '') AS status
      FROM sessions s
      CROSS JOIN LATERAL jsonb_array_elements(
        COALESCE(s.custom_data->'classes', '[]'::jsonb)
      ) AS cls(value)
      WHERE s.workspace_subdomain = ${subdomain}
        AND s.deleted_at IS NULL
      ORDER BY session ASC, class ASC
    `);

    const trendResult = await tx.execute(sql`
      WITH monthly AS (
        SELECT
          to_char(
            date_trunc(
              'month',
              (NULLIF(trim(e.custom_data->>'enrolledDate'), ''))::timestamp
            ),
            'YYYY-MM'
          ) AS "monthKey",
          NULLIF(trim(COALESCE(s.custom_data->>'name', '')), '') AS "sessionName",
          count(*)::int AS cnt
        FROM enrollments e
        LEFT JOIN sessions s
          ON s.workspace_subdomain = e.workspace_subdomain
          AND s.id = e.custom_data->>'sessionId'
          AND s.deleted_at IS NULL
        WHERE e.workspace_subdomain = ${subdomain}
          AND NULLIF(trim(e.custom_data->>'enrolledDate'), '') IS NOT NULL
          AND NULLIF(trim(e.custom_data->>'enrolledDate'), '') ~ '^[0-9]{4}'
        GROUP BY 1, 2
      ),
      totals AS (
        SELECT "monthKey", sum(cnt)::int AS students
        FROM monthly
        WHERE "monthKey" IS NOT NULL
        GROUP BY 1
      ),
      tops AS (
        SELECT DISTINCT ON ("monthKey")
          "monthKey",
          "sessionName"
        FROM monthly
        WHERE "sessionName" IS NOT NULL
        ORDER BY "monthKey", cnt DESC
      )
      SELECT
        t."monthKey",
        t.students,
        tops."sessionName"
      FROM totals t
      LEFT JOIN tops ON tops."monthKey" = t."monthKey"
      ORDER BY t."monthKey" ASC
    `);

    const todayResult = await tx.execute(sql`
      SELECT
        (s.id || '-' || COALESCE(cls.value->>'id', cls.ordinality::text)) AS id,
        (
          COALESCE(s.custom_data->>'name', '')
          || ' – '
          || COALESCE(cls.value->>'name', '')
        ) AS name,
        COALESCE(NULLIF(trim(cls.value->>'teacherName'), ''), '') AS teacher,
        CASE
          WHEN match_tt.tt IS NOT NULL
            THEN COALESCE(match_tt.tt->>'startTime', '')
              || ' - '
              || COALESCE(match_tt.tt->>'endTime', '')
          ELSE ''
        END AS time,
        COALESCE(cls.value->>'room', '') AS room,
        COALESCE((cls.value->>'enrolled')::int, 0) AS students,
        CASE WHEN match_tt.tt IS NOT NULL THEN 'live' ELSE 'upcoming' END AS status
      FROM sessions s
      CROSS JOIN LATERAL jsonb_array_elements(
        COALESCE(s.custom_data->'classes', '[]'::jsonb)
      ) WITH ORDINALITY AS cls(value, ordinality)
      LEFT JOIN LATERAL (
        SELECT tt.value AS tt
        FROM jsonb_array_elements(
          COALESCE(s.custom_data->'timetable', '[]'::jsonb)
        ) AS tt(value)
        WHERE tt.value->>'day' = ${todayKey}
          AND tt.value->>'location' = COALESCE(cls.value->>'room', '')
        LIMIT 1
      ) AS match_tt ON true
      WHERE s.workspace_subdomain = ${subdomain}
        AND s.deleted_at IS NULL
        AND lower(trim(COALESCE(s.custom_data->>'status', ''))) = 'active'
      ORDER BY name ASC
    `);

    const capacity = getQueryRows<Record<string, unknown>>(capacityResult).map((row) => ({
      sessionId: String(row.sessionId ?? ''),
      classId: String(row.classId ?? ''),
      session: String(row.session ?? ''),
      class: String(row.class ?? ''),
      enrolled: Number(row.enrolled ?? 0),
      capacity: Number(row.capacity ?? 0),
      rate: Number(row.rate ?? 0),
      status: String(row.status ?? ''),
    }));

    const enrollmentTrends = getQueryRows<Record<string, unknown>>(trendResult)
      .filter((row) => typeof row.monthKey === 'string' && /^\d{4}-\d{2}$/.test(row.monthKey))
      .map((row) => ({
        monthKey: String(row.monthKey),
        students: Number(row.students ?? 0),
        sessionName: row.sessionName == null || row.sessionName === '' ? null : String(row.sessionName),
      }));

    const todaysSessions = getQueryRows<Record<string, unknown>>(todayResult).map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      teacher: String(row.teacher ?? ''),
      time: String(row.time ?? ''),
      room: String(row.room ?? ''),
      students: Number(row.students ?? 0),
      status: row.status === 'live' ? ('live' as const) : ('upcoming' as const),
    }));

    return { capacity, enrollmentTrends, todaysSessions };
  });
}
