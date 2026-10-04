import { and, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import type {
  FacultyDesignationHolding,
  FacultyDesignationHoldingStatus,
} from '@mms/shared';
import {
  facultyAssignments,
  facultyDepartments,
  facultyDesignationRoles,
  facultyDesignations,
} from '../schema.js';
import { withTenantRead } from '../tenant-context.js';

/** Batch-loads all date-effective designation holdings (active + inactive) per faculty. */
export async function listCurrentFacultyDesignationHoldings(
  tenant: string,
  facultyIds: string[],
  onDate = new Date().toISOString().slice(0, 10),
): Promise<Map<string, FacultyDesignationHolding[]>> {
  if (facultyIds.length === 0) return new Map();
  const workspaceSubdomain = tenant.trim().toLowerCase();
  return withTenantRead(workspaceSubdomain, async (tx) => {
    const [rows, roles] = await Promise.all([
      tx.select({
        facultyId: facultyAssignments.facultyId,
        designationId: facultyAssignments.designationId,
        designationName: facultyDesignations.name,
        departmentId: facultyAssignments.departmentId,
        departmentName: facultyDepartments.name,
        isPrimary: facultyAssignments.isPrimary,
        status: facultyAssignments.status,
        startsOn: facultyAssignments.startDate,
        endsOn: facultyAssignments.endDate,
      }).from(facultyAssignments)
        .innerJoin(facultyDesignations, and(
          eq(facultyDesignations.workspaceSubdomain, facultyAssignments.workspaceSubdomain),
          eq(facultyDesignations.id, facultyAssignments.designationId),
        ))
        .innerJoin(facultyDepartments, and(
          eq(facultyDepartments.workspaceSubdomain, facultyAssignments.workspaceSubdomain),
          eq(facultyDepartments.id, facultyAssignments.departmentId),
        ))
        .where(and(
          eq(facultyAssignments.workspaceSubdomain, workspaceSubdomain),
          inArray(facultyAssignments.facultyId, facultyIds),
          isNull(facultyAssignments.deletedAt),
          lte(facultyAssignments.startDate, onDate),
          or(isNull(facultyAssignments.endDate), gte(facultyAssignments.endDate, onDate)),
        ))
        .orderBy(desc(facultyAssignments.isPrimary), desc(facultyAssignments.startDate)),
      tx.select({ designationId: facultyDesignationRoles.designationId, roleKey: facultyDesignationRoles.roleKey })
        .from(facultyDesignationRoles)
        .where(eq(facultyDesignationRoles.workspaceSubdomain, workspaceSubdomain)),
    ]);
    const rolesByDesignation = new Map<string, string[]>();
    for (const role of roles) {
      rolesByDesignation.set(role.designationId, [...(rolesByDesignation.get(role.designationId) ?? []), role.roleKey]);
    }
    const byFaculty = new Map<string, FacultyDesignationHolding[]>();
    for (const row of rows) {
      const status: FacultyDesignationHoldingStatus =
        row.status === 'inactive' ? 'inactive' : 'active';
      const list = byFaculty.get(row.facultyId) ?? [];
      list.push({
        designationId: row.designationId,
        departmentId: row.departmentId,
        status,
        startsOn: row.startsOn,
        endsOn: row.endsOn ?? null,
        isPrimary: row.isPrimary,
        designationName: row.designationName,
        departmentName: row.departmentName,
        assignableRoles: rolesByDesignation.get(row.designationId) ?? [],
      });
      byFaculty.set(row.facultyId, list);
    }
    return byFaculty;
  });
}
