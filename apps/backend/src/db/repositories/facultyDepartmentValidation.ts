import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';
import type { InsertFacultyDepartmentRow } from '../schema/facultyDepartmentTables.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';

export async function validateFacultyDepartment(
  tx: Pick<TenantTransaction, 'execute'>, tenant: string, input: InsertFacultyDepartmentRow,
): Promise<void> {
  await lockFacultyHierarchy(tx, tenant);
  const existing = await tx.execute<{ deleted_at: Date | null }>(sql`
    SELECT deleted_at FROM faculty_departments WHERE workspace_subdomain = ${tenant}
      AND id = ${input.id} FOR UPDATE
  `);
  if (existing.rows.some((row) => row.deleted_at !== null)) throw new Error('Department is archived');
  if (input.headFacultyId) {
    const head = await tx.execute(sql`SELECT id FROM faculty WHERE workspace_subdomain = ${tenant}
      AND id = ${input.headFacultyId} AND deleted_at IS NULL FOR SHARE`);
    if (!head.rows.length) throw new Error('Department head must be active in this workspace');
  }
  if (!input.parentId) return;
  const result = await tx.execute<{ id: string; parent_id: string | null; depth: number; cycle: boolean }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, 0 AS depth, ARRAY[id] AS path, FALSE AS cycle
      FROM faculty_departments WHERE workspace_subdomain = ${tenant} AND id = ${input.parentId}
        AND deleted_at IS NULL
      UNION ALL
      SELECT d.id, d.parent_id, p.depth + 1, p.path || d.id, d.id = ANY(p.path)
      FROM faculty_departments d JOIN ancestors p ON p.parent_id = d.id
      WHERE d.workspace_subdomain = ${tenant} AND d.deleted_at IS NULL AND NOT p.cycle AND p.depth < 20
    ) SELECT id, parent_id, depth, cycle FROM ancestors
  `);
  if (!result.rows.length) throw new Error('Parent department is missing or archived');
  const visited = new Set(result.rows.map((row) => row.id));
  if (result.rows.some((row) => row.id === input.id || row.cycle || (row.parent_id !== null && !visited.has(row.parent_id)))) {
    throw new Error('Circular department hierarchy or hierarchy depth limit exceeded');
  }
}

export async function validateDepartmentDeletion(tx: Pick<TenantTransaction, 'execute'>, tenant: string, id: string) {
  await lockFacultyHierarchy(tx, tenant);
  const dependents = await tx.execute(sql`
    SELECT id FROM faculty_departments WHERE workspace_subdomain = ${tenant}
      AND parent_id = ${id} AND deleted_at IS NULL
    UNION ALL
    SELECT id FROM faculty_assignments WHERE workspace_subdomain = ${tenant}
      AND department_id = ${id} AND deleted_at IS NULL LIMIT 1
  `);
  if (dependents.rows.length) throw new Error('Department has active children or assignments');
}
