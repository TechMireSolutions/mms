import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  type StudentsCommandMetricsSnapshot,
} from '@mms/shared';
import { students } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { statusExpr } from './studentRepositoryListQuery.js';

/** SQL aggregates for Students command-centre metrics (active rows only). */
export async function aggregateStudentsCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<StudentsCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const registeredRaw = sql`NULLIF(trim(COALESCE(
      ${students.registeredDate},
      to_char(${students.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      ''
    )), '')`;

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'active')::int`,
        inactive: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'inactive')::int`,
        suspended: sql<number>`count(*) FILTER (WHERE ${statusExpr()} = 'suspended')::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${registeredRaw} IS NOT NULL
          AND ${registeredRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${registeredRaw})::timestamptz
            >= (NOW() - (${periodDays} * INTERVAL '1 day'))
        )::int`,
      })
      .from(students)
      .where(and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      suspended: Number(row?.suspended ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
    };
  });
}
