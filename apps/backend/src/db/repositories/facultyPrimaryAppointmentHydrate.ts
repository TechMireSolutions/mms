import { and, eq, inArray, desc } from 'drizzle-orm';
import { primaryAssignmentEffectiveTodayWhere } from './facultyPrimaryAppointmentEffective.js';
import type { FacultyMember } from '@mms/shared';
import {
  facultyAssignments,
  facultyDepartments,
  facultyDesignations,
} from '../schema.js';
import type { AppDb } from '../tenant-context.js';

export async function attachPrimaryAppointmentFields(
  tx: AppDb,
  subdomain: string,
  rows: FacultyMember[],
): Promise<FacultyMember[]> {
  if (rows.length === 0) return rows;
  const facultyIds = rows.map((row) => String(row.id));
  const appointmentRows = await tx
    .select({
      facultyId: facultyAssignments.facultyId,
      departmentId: facultyAssignments.departmentId,
      designationId: facultyAssignments.designationId,
      departmentName: facultyDepartments.name,
      designationName: facultyDesignations.name,
      hierarchyRank: facultyDesignations.hierarchyRank,
      startDate: facultyAssignments.startDate,
    })
    .from(facultyAssignments)
    .innerJoin(facultyDepartments, and(
      eq(facultyDepartments.workspaceSubdomain, facultyAssignments.workspaceSubdomain),
      eq(facultyDepartments.id, facultyAssignments.departmentId),
    ))
    .innerJoin(facultyDesignations, and(
      eq(facultyDesignations.workspaceSubdomain, facultyAssignments.workspaceSubdomain),
      eq(facultyDesignations.id, facultyAssignments.designationId),
    ))
    .where(and(
      eq(facultyAssignments.workspaceSubdomain, subdomain),
      inArray(facultyAssignments.facultyId, facultyIds),
      primaryAssignmentEffectiveTodayWhere(),
    ))
    .orderBy(desc(facultyAssignments.startDate));

  const byFaculty = new Map<string, typeof appointmentRows[number]>();
  for (const row of appointmentRows) {
    if (!byFaculty.has(row.facultyId)) byFaculty.set(row.facultyId, row);
  }

  return rows.map((row) => {
    const primary = byFaculty.get(String(row.id));
    if (!primary) return row;
    return {
      ...row,
      departmentId: primary.departmentId,
      designationId: primary.designationId,
      department: primary.departmentName,
      designation: primary.designationName,
      hierarchyRank: primary.hierarchyRank,
    };
  });
}
