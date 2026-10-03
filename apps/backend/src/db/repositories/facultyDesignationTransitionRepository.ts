import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { FacultyDesignationTransitionWrite } from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';
import { listFacultyDesignationAssignments, saveFacultyDesignationAssignment } from './facultyDesignationAssignmentRepository.js';
import { ConflictError, NotFoundError } from '../../lib/httpErrors.js';

export async function transitionFacultyDesignation(
  tenant: string,
  facultyId: string,
  input: FacultyDesignationTransitionWrite,
) {
  return withTenant(tenant, async (tx) => {
    await lockFacultyHierarchy(tx, tenant);
    const [member] = await tx.select({ id: faculty.id }).from(faculty)
      .where(and(eq(faculty.workspaceSubdomain, tenant), eq(faculty.id, facultyId), isNull(faculty.deletedAt)))
      .limit(1).for('update');
    if (!member) throw new NotFoundError('Faculty member not found');
    const history = await listFacultyDesignationAssignments(tenant, facultyId);
    const current = history.find((assignment) => assignment.id === input.currentAssignmentId);
    if (input.currentAssignmentId && !current) throw new ConflictError('Designation history changed; reload and try again');
    if (current && (!current.endsOn || current.endsOn >= input.transitionDate)) {
      if (input.transitionDate <= current.startsOn) throw new ConflictError('Transition must follow the current designation start date');
      const date = new Date(`${input.transitionDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - 1);
      await saveFacultyDesignationAssignment(tenant, {
        id: current.id, facultyId, designationId: current.designationId,
        startsOn: current.startsOn, endsOn: date.toISOString().slice(0, 10), notes: current.notes,
      });
    }
    return saveFacultyDesignationAssignment(tenant, {
      id: randomUUID(), facultyId, designationId: input.newDesignationId,
      startsOn: input.transitionDate, endsOn: null, notes: input.notes,
    });
  });
}
