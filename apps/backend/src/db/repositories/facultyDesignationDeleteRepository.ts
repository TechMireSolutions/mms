import { and, eq } from 'drizzle-orm';
import {
  facultyDesignationAssignments,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { syncFacultyCurrentDesignation } from './facultyDesignationSync.js';

/**
 * Deletes a designation assignment by id.
 * Rejects with status 409 when the member has no other assignment —
 * a faculty member must always have at least one designation on record.
 */
export async function deleteFacultyDesignationAssignment(
  tenant: string,
  facultyId: string,
  assignmentId: string,
): Promise<void> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  await withTenant(workspaceSubdomain, async (tx) => {
    const [target] = await tx.select({ id: facultyDesignationAssignments.id })
      .from(facultyDesignationAssignments)
      .where(and(
        eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignationAssignments.facultyId, facultyId),
        eq(facultyDesignationAssignments.id, assignmentId),
      )).limit(1);
    if (!target) {
      const err = new Error('Designation assignment not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    const remaining = await tx.select({ id: facultyDesignationAssignments.id })
      .from(facultyDesignationAssignments)
      .where(and(
        eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignationAssignments.facultyId, facultyId),
      ));
    if (remaining.length <= 1) {
      const err = new Error(
        'Cannot delete the only designation assignment. A faculty member must retain at least one designation record.',
      ) as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    await tx.delete(facultyDesignationAssignments).where(and(
      eq(facultyDesignationAssignments.workspaceSubdomain, workspaceSubdomain),
      eq(facultyDesignationAssignments.id, assignmentId),
    ));
    await syncFacultyCurrentDesignation(tx, workspaceSubdomain, facultyId);
  });
}
