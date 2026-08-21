import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  DEFAULT_TEACHER_STATUS,
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  resolveTeacherStatusRoles,
  type TeachersCommandMetricsSnapshot,
} from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { teacherStatusExpr } from './teacherRepositoryListQuery.js';

/**
 * Set typed `status` for active teachers in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateTeachersStatusSql(
  workspaceSubdomain: string,
  ids: string[],
  status: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedStatus = status.trim().toLowerCase() || DEFAULT_TEACHER_STATUS;

  return withTenantTransaction(subdomain, async (tx) => {
    const updated = await tx
      .update(teachers)
      .set({
        status: normalizedStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          inArray(teachers.id, uniqueIds),
          isNull(teachers.deletedAt),
        ),
      )
      .returning({ id: teachers.id });
    return updated.length;
  });
}

/**
 * Set typed `specialization` for active teachers in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateTeachersSpecializationSql(
  workspaceSubdomain: string,
  ids: string[],
  specialization: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedSpecialization = specialization.trim();

  return withTenantTransaction(subdomain, async (tx) => {
    const updated = await tx
      .update(teachers)
      .set({
        specialization: normalizedSpecialization || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          inArray(teachers.id, uniqueIds),
          isNull(teachers.deletedAt),
        ),
      )
      .returning({ id: teachers.id });
    return updated.length;
  });
}

/** SQL aggregates for Teachers command-centre metrics (active rows only). */
export async function aggregateTeachersCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<TeachersCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const joinDateRaw = sql`NULLIF(trim(COALESCE(
      ${teachers.joinDate},
      to_char(${teachers.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      ''
    )), '')`;
    const status = teacherStatusExpr();
    const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } =
      resolveTeacherStatusRoles();

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${status} = ${activeStatus})::int`,
        inactive: sql<number>`count(*) FILTER (WHERE ${status} = ${inactiveStatus})::int`,
        onLeave: sql<number>`count(*) FILTER (WHERE ${status} = ${onLeaveStatus})::int`,
        other: sql<number>`count(*) FILTER (WHERE ${status} IS NOT NULL AND ${status} <> '' AND ${status} NOT IN (${activeStatus}, ${inactiveStatus}, ${onLeaveStatus}))::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${joinDateRaw} IS NOT NULL
          AND ${joinDateRaw} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          AND (${joinDateRaw})::timestamptz
            >= (NOW() - (${periodDays} * INTERVAL '1 day'))
        )::int`,
      })
      .from(teachers)
      .where(and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt)));

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      inactive: Number(row?.inactive ?? 0),
      onLeave: Number(row?.onLeave ?? 0),
      other: Number(row?.other ?? 0),
      newThisPeriod: Number(row?.newThisPeriod ?? 0),
    };
  });
}
