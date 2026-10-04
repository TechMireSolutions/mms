import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  faculty,
  facultyAssignments,
  facultyDesignations,
} from '../schema.js';
import type { TenantTransaction } from '../tenant-context.js';

/**
 * Synchronizes the faculty row's cached designation and hierarchy_rank
 * with the currently effective primary faculty_assignments row.
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
    startDate: facultyAssignments.startDate,
    endDate: facultyAssignments.endDate,
  }).from(facultyAssignments)
    .innerJoin(facultyDesignations, and(
      eq(facultyDesignations.workspaceSubdomain, facultyAssignments.workspaceSubdomain),
      eq(facultyDesignations.id, facultyAssignments.designationId),
    ))
    .where(and(
      eq(facultyAssignments.workspaceSubdomain, workspaceSubdomain),
      eq(facultyAssignments.facultyId, facultyId),
      eq(facultyAssignments.isPrimary, true),
      isNull(facultyAssignments.deletedAt),
    ))
    .orderBy(desc(facultyAssignments.startDate));

  const current = rows.find((r) => r.startDate <= today && (!r.endDate || r.endDate >= today)) ?? rows[0];
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
