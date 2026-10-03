import { sql } from 'drizzle-orm';
import { withTenant } from '../tenant-context.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';
import { ConflictError } from '../../lib/httpErrors.js';

export async function guardFacultyAssignmentDependents(tenant: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await withTenant(tenant, async (tx) => {
    await lockFacultyHierarchy(tx, tenant);
    const members = sql.join(ids.map((id) => sql`${id}`), sql`, `);
    const dependents = await tx.execute(sql`
      SELECT child.id FROM faculty_assignments child
      JOIN faculty_assignments parent ON parent.workspace_subdomain = child.workspace_subdomain
        AND parent.id = child.reports_to_assignment_id
      JOIN faculty member ON member.workspace_subdomain = child.workspace_subdomain
        AND member.id = child.faculty_id
      WHERE child.workspace_subdomain = ${tenant}
        AND parent.faculty_id IN (${members}) AND child.faculty_id NOT IN (${members})
        AND child.deleted_at IS NULL AND parent.deleted_at IS NULL AND member.deleted_at IS NULL
      LIMIT 1
    `);
    if (dependents.rows.length) {
      throw new ConflictError('Reassign reporting assignments before deleting their supervisor');
    }
  });
}
