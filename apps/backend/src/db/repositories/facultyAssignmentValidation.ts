import { validatePositionOccupancy } from './positionOccupancyValidation.js';
import { assignmentHierarchySql } from './facultyHierarchySql.js';
import type { AssignmentTreeNode } from './facultyAssignmentHierarchyRepository.js';
import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';
import type { InsertFacultyAssignmentRow } from '../schema/facultyAssignmentTables.js';

export async function lockFacultyHierarchy(tx: Pick<TenantTransaction, 'execute'>, tenant: string): Promise<void> {
  // One tenant-scoped lock serializes changes to both hierarchy edges and appointments.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`faculty:${tenant}`}, 0))`);
}

export async function validateFacultyAssignment(
  tx: Pick<TenantTransaction, 'execute'>,
  tenant: string,
  input: InsertFacultyAssignmentRow,
): Promise<void> {
  await lockFacultyHierarchy(tx, tenant);
  const existing = await tx.execute<{ faculty_id: string; deleted_at: Date | null }>(sql`
    SELECT faculty_id, deleted_at FROM faculty_assignments
    WHERE workspace_subdomain = ${tenant} AND id = ${input.id} FOR UPDATE
  `);
  if (existing.rows.some((row) => row.faculty_id !== input.facultyId || row.deleted_at !== null)) {
    throw new Error('Assignment is archived or belongs to another faculty member');
  }
  const member = await tx.execute(sql`
    SELECT id FROM faculty WHERE workspace_subdomain = ${tenant}
      AND id = ${input.facultyId} AND deleted_at IS NULL FOR UPDATE
  `);
  const department = await tx.execute(sql`
    SELECT id FROM faculty_departments WHERE workspace_subdomain = ${tenant}
      AND id = ${input.departmentId} AND deleted_at IS NULL FOR SHARE
  `);
  const designation = await tx.execute(sql`
    SELECT id FROM faculty_designations WHERE workspace_subdomain = ${tenant}
      AND id = ${input.designationId} AND deleted_at IS NULL AND is_active FOR SHARE
  `);
  if (!member.rows.length || !department.rows.length || !designation.rows.length) {
    throw new Error('Faculty, department and designation must be active in this workspace');
  }
  if (input.endDate && input.endDate < input.startDate) throw new Error('End date precedes start date');
  if (input.isPrimary) {
    const overlaps = await tx.execute(sql`
      SELECT id FROM faculty_assignments WHERE workspace_subdomain = ${tenant}
        AND faculty_id = ${input.facultyId} AND id <> ${input.id} AND deleted_at IS NULL AND is_primary
        AND start_date <= COALESCE(${input.endDate ?? null}::date, 'infinity'::date)
        AND COALESCE(end_date, 'infinity'::date) >= ${input.startDate}::date LIMIT 1
    `);
    if (overlaps.rows.length) throw new Error('Primary assignment overlaps an existing appointment');
  }
  if (input.positionId) await validatePositionOccupancy(tx, tenant, input);
  if (!input.reportsToAssignmentId) return;
  const parent = await tx.execute<{ id: string; faculty_id: string; reports_to_assignment_id: string | null }>(sql`
    SELECT a.id, a.faculty_id, a.reports_to_assignment_id FROM faculty_assignments a
    JOIN faculty f ON f.workspace_subdomain = a.workspace_subdomain AND f.id = a.faculty_id
    JOIN faculty_departments d ON d.workspace_subdomain = a.workspace_subdomain AND d.id = a.department_id
    JOIN faculty_designations g ON g.workspace_subdomain = a.workspace_subdomain AND g.id = a.designation_id
    WHERE a.workspace_subdomain = ${tenant} AND a.id = ${input.reportsToAssignmentId}
      AND a.deleted_at IS NULL AND f.deleted_at IS NULL AND d.deleted_at IS NULL AND g.deleted_at IS NULL
    FOR SHARE OF a, f, d, g
  `);
  const root = parent.rows[0];
  if (!root) throw new Error('Reporting assignment is missing or archived');
  if (root.id === input.id || root.faculty_id === input.facultyId) throw new Error('Circular reporting hierarchy');
  const chain = await tx.execute<AssignmentTreeNode & Record<string, unknown>>(
    assignmentHierarchySql(tenant, input.reportsToAssignmentId, 'up', 20),
  );
  const visited = new Set([root.id, ...chain.rows.map((row) => row.id)]);
  if ((root.reports_to_assignment_id && !visited.has(root.reports_to_assignment_id)) || chain.rows.some((row) =>
    row.id === input.id || row.facultyId === input.facultyId || row.isCycle
      || (row.reportsToAssignmentId !== null && !visited.has(row.reportsToAssignmentId)))) {
    throw new Error('Circular reporting hierarchy, archived ancestor, or hierarchy depth limit exceeded');
  }
}
