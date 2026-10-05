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
      SELECT child.id FROM faculty_assignments parent
      JOIN organization_positions pop ON pop.workspace_subdomain = parent.workspace_subdomain
        AND pop.id = parent.position_id AND pop.deleted_at IS NULL
      JOIN organization_positions child_pos ON child_pos.workspace_subdomain = pop.workspace_subdomain
        AND child_pos.parent_position_id = pop.id AND child_pos.deleted_at IS NULL
      JOIN faculty_assignments child ON child.workspace_subdomain = child_pos.workspace_subdomain
        AND child.position_id = child_pos.id AND child.deleted_at IS NULL
      JOIN faculty member ON member.workspace_subdomain = child.workspace_subdomain
        AND member.id = child.faculty_id
      WHERE child.workspace_subdomain = ${tenant}
        AND parent.faculty_id IN (${members}) AND child.faculty_id NOT IN (${members})
        AND child.deleted_at IS NULL AND parent.deleted_at IS NULL AND member.deleted_at IS NULL
      LIMIT 1
    `);
    if (dependents.rows.length) {
      throw new ConflictError('Reassign position reporting before deleting their supervisor');
    }

    // Session FKs are ON DELETE RESTRICT — block soft-delete while *active* sessions
    // still reference faculty (archived sessions must not permanently block delete).
    const sessionLinks = await tx.execute(sql`
      SELECT 1 FROM (
        SELECT sf.faculty_id
        FROM session_faculty sf
        JOIN sessions s
          ON s.workspace_subdomain = sf.workspace_subdomain
          AND s.id = sf.session_id
          AND s.deleted_at IS NULL
        WHERE sf.workspace_subdomain = ${tenant} AND sf.faculty_id IN (${members})
        UNION ALL
        SELECT sc.faculty_id
        FROM session_classes sc
        JOIN sessions s
          ON s.workspace_subdomain = sc.workspace_subdomain
          AND s.id = sc.session_id
          AND s.deleted_at IS NULL
        WHERE sc.workspace_subdomain = ${tenant}
          AND sc.faculty_id IN (${members})
          AND sc.faculty_id IS NOT NULL
        UNION ALL
        SELECT p.faculty_id
        FROM session_class_timetable_periods p
        JOIN session_class_timetables t
          ON t.workspace_subdomain = p.workspace_subdomain
          AND t.id = p.timetable_id
        JOIN session_classes sc
          ON sc.workspace_subdomain = t.workspace_subdomain
          AND sc.id = t.session_class_id
        JOIN sessions s
          ON s.workspace_subdomain = sc.workspace_subdomain
          AND s.id = sc.session_id
          AND s.deleted_at IS NULL
        WHERE p.workspace_subdomain = ${tenant}
          AND p.faculty_id IN (${members})
          AND p.faculty_id IS NOT NULL
      ) links
      LIMIT 1
    `);
    if (sessionLinks.rows.length) {
      throw new ConflictError(
        'Remove or reassign session faculty links before deleting this faculty member',
      );
    }
  });
}
