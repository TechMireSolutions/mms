import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  DEFAULT_FACULTY_STATUS,
  dedupeTrimmedIds,
  MODULE_METRICS_DEFAULT_PERIOD_DAYS,
  resolveFacultyStatusRoles,
  type FacultyCommandMetricsSnapshot,
} from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { facultyStatusExpr } from './facultyRepositoryListQuerySql.js';

/**
 * Set typed `status` for active faculty in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateFacultyStatusSql(
  workspaceSubdomain: string,
  ids: string[],
  status: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = dedupeTrimmedIds(ids);
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedStatus = status.trim().toLowerCase() || DEFAULT_FACULTY_STATUS;

  return withTenant(subdomain, async (tx) => {
    const updated = await tx
      .update(faculty)
      .set({
        status: normalizedStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          inArray(faculty.id, uniqueIds),
          isNull(faculty.deletedAt),
        ),
      )
      .returning({ id: faculty.id });
    return updated.length;
  });
}

/**
 * Set typed `specialization` for active faculty in one UPDATE.
 * Returns how many rows were updated; callers treat missing/deleted ids as failed.
 */
export async function bulkUpdateFacultySpecializationSql(
  workspaceSubdomain: string,
  ids: string[],
  specialization: string,
): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const uniqueIds = dedupeTrimmedIds(ids);
  if (!subdomain || uniqueIds.length === 0) return 0;
  const normalizedSpecialization = specialization.trim();

  return withTenant(subdomain, async (tx) => {
    const updated = await tx
      .update(faculty)
      .set({
        specialization: normalizedSpecialization || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          inArray(faculty.id, uniqueIds),
          isNull(faculty.deletedAt),
        ),
      )
      .returning({ id: faculty.id });
    return updated.length;
  });
}

/** SQL aggregates for Faculty command-centre metrics (active rows only). */
export async function aggregateFacultyCommandMetrics(
  tenant: string,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): Promise<FacultyCommandMetricsSnapshot> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const joinDateExpr = sql`COALESCE(
      CASE WHEN ${faculty.joinDate}::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN (${faculty.joinDate})::date ELSE NULL END,
      (${faculty.createdAt})::date
    )`;
    const status = facultyStatusExpr();
    const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } =
      resolveFacultyStatusRoles();

    const rows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${status} = ${activeStatus})::int`,
        inactive: sql<number>`count(*) FILTER (WHERE ${status} = ${inactiveStatus})::int`,
        onLeave: sql<number>`count(*) FILTER (WHERE ${status} = ${onLeaveStatus})::int`,
        other: sql<number>`count(*) FILTER (WHERE ${status} IS NOT NULL AND ${status} <> '' AND ${status} NOT IN (${activeStatus}, ${inactiveStatus}, ${onLeaveStatus}))::int`,
        newThisPeriod: sql<number>`count(*) FILTER (WHERE
          ${joinDateExpr} >= (CURRENT_DATE - (${periodDays} * INTERVAL '1 day'))::date
        )::int`,
      })
      .from(faculty)
      .where(and(eq(faculty.workspaceSubdomain, subdomain), isNull(faculty.deletedAt)));

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

