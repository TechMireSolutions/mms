import { and, desc, eq } from 'drizzle-orm';
import {
  faculty,
  facultyDesignationAssignments,
  facultyDesignations,
} from '../schema.js';
import type { TenantTransaction } from '../tenant-context.js';

/**
 * Synchronizes the faculty row's cached designation and hierarchy_rank
 * with the currently effective assignment in faculty_designation_assignments.
 */
export async function syncFacultyCurrentDesignation(
  tx: TenantTransaction,
  workspaceSubdomain: string,
  facultyId: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await tx.select({
    name: facultyDesignations.name,
    hierarchyRank: facultyDesignations.hierarchyRank,
    startsOn: facultyDesignationAssignments.startsOn,
    endsOn: facultyDesignationAssignments.endsOn,
  }).from(facultyDesignationAssignments)
    .innerJoin(facultyDesignations, and(
      eq(facultyDesignations.workspaceSubdomain, facultyDesignationAssignments.workspaceSubdomain),
      eq(facultyDesignations.id, facultyDesignationAssignments.designationId),
    ))
    .where(and(
      eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
      eq(facultyDesignationAssignments.facultyId, facultyId),
    ))
    .orderBy(desc(facultyDesignationAssignments.startsOn));

  const current = rows.find((r) => r.startsOn <= today && (!r.endsOn || r.endsOn >= today)) ?? rows[0];
  if (current) {
    await tx.update(faculty).set({
      designation: current.name,
      hierarchyRank: current.hierarchyRank,
      updatedAt: new Date(),
    }).where(and(
      eq(faculty.workspaceSubdomain, workspaceSubdomain),
      eq(faculty.id, facultyId),
    ));
  }
}
