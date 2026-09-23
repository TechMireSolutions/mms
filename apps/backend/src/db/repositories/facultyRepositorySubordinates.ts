import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { hydrateTeachersList } from './facultyRepository.js';

export async function countSubordinates(tenant: string, supervisorId: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, supervisorId),
        sql`${teachers.deletedAt} is null`,
      ));
    return Number(rows[0]?.count ?? 0);
  });
}

export async function countSubordinatesBatch(
  tenant: string,
  supervisorIds: string[],
): Promise<Record<string, number>> {
  if (supervisorIds.length === 0) return {};
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({
        supervisorId: teachers.reportingFacultyId,
        count: sql<number>`count(*)::int`,
      })
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        inArray(teachers.reportingFacultyId, supervisorIds),
        sql`${teachers.deletedAt} is null`,
      ))
      .groupBy(teachers.reportingFacultyId);

    const result: Record<string, number> = {};
    for (const r of rows) {
      if (r.supervisorId) {
        result[r.supervisorId] = Number(r.count ?? 0);
      }
    }
    return result;
  });
}

export async function findSubordinates(tenant: string, supervisorId: string): Promise<Teacher[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        department: teachers.department,
        designation: teachers.designation,
        reportingFacultyId: teachers.reportingFacultyId,
        hierarchyRank: teachers.hierarchyRank,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        customData: teachers.customData,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        restoredAt: teachers.restoredAt,
        restoredBy: teachers.restoredBy,
        deletedWithCascade: teachers.deletedWithCascade,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
      .from(teachers)
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, supervisorId),
        sql`${teachers.deletedAt} is null`,
      ));
    return hydrateTeachersList(tx, subdomain, rows);
  });
}

export async function reassignSubordinates(
  tenant: string,
  oldSupervisorId: string,
  newSupervisorId: string | null,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const result = await tx
      .update(teachers)
      .set({
        reportingFacultyId: newSupervisorId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teachers.workspaceSubdomain, subdomain),
        eq(teachers.reportingFacultyId, oldSupervisorId),
        sql`${teachers.deletedAt} is null`,
      ));
    return (result as { rowCount?: number }).rowCount ?? 0;
  });
}
