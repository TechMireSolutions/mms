import { and, eq, isNull } from 'drizzle-orm';
import type {
  FacultyDesignationAssignment,
  FacultyDesignationAssignmentWrite,
} from '@mms/shared';
import {
  facultyDesignationAssignments,
  facultyDesignations,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { listFacultyDesignations } from './facultyDesignationRepository.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';

/**
 * Legacy FDA write — HTTP handlers return 410 Gone.
 * Prefer faculty_assignments for all appointment mutations.
 */
export async function saveFacultyDesignationAssignment(
  tenant: string,
  input: FacultyDesignationAssignmentWrite,
): Promise<FacultyDesignationAssignment> {
  const workspaceSubdomain = tenant.trim().toLowerCase();
  await withTenant(workspaceSubdomain, async (tx) => {
    await lockFacultyHierarchy(tx, workspaceSubdomain);
    const [designation] = await tx.select({ id: facultyDesignations.id, isActive: facultyDesignations.isActive })
      .from(facultyDesignations)
      .where(and(
        eq(facultyDesignations.workspaceSubdomain, workspaceSubdomain),
        eq(facultyDesignations.id, input.designationId),
        isNull(facultyDesignations.deletedAt),
      )).limit(1);
    if (!designation?.isActive) throw new Error('Designation is missing or inactive');
    await tx.insert(facultyDesignationAssignments).values({
      workspaceSubdomain,
      id: input.id,
      facultyId: input.facultyId,
      designationId: input.designationId,
      startsOn: input.startsOn,
      endsOn: input.endsOn ?? null,
      notes: input.notes ?? null,
    }).onConflictDoUpdate({
      target: [facultyDesignationAssignments.workspaceSubdomain, facultyDesignationAssignments.id],
      set: {
        designationId: input.designationId,
        startsOn: input.startsOn,
        endsOn: input.endsOn ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      },
    });
  });
  const definitions = await listFacultyDesignations(workspaceSubdomain);
  const def = definitions.find((d) => d.id === input.designationId);
  return {
    id: input.id,
    facultyId: input.facultyId,
    designationId: input.designationId,
    designationName: def?.name,
    hierarchyRank: def?.hierarchyRank,
    assignableRoles: def?.assignableRoles ?? [],
    startsOn: input.startsOn,
    endsOn: input.endsOn ?? null,
    notes: input.notes ?? null,
  };
}
