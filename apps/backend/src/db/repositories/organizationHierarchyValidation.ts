import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';
import { lockFacultyHierarchy } from './facultyAssignmentValidation.js';

export async function validateOrganizationParent(
  tx: Pick<TenantTransaction, 'execute'>,
  tenant: string,
  kind: 'position' | 'location',
  id: string,
  parentId: string | null | undefined,
): Promise<void> {
  await lockFacultyHierarchy(tx, tenant);
  if (!parentId) return;
  const table = kind === 'position' ? sql`organization_positions` : sql`organization_locations`;
  const parent = kind === 'position' ? sql`parent_position_id` : sql`parent_location_id`;
  const result = await tx.execute<{ id: string; parent_id: string | null; cycle: boolean; depth: number }>(sql`
    WITH RECURSIVE chain AS (
      SELECT id, ${parent} AS parent_id, ARRAY[id] AS path, FALSE AS cycle, 1 AS depth
      FROM ${table} WHERE workspace_subdomain = ${tenant} AND id = ${parentId}
        AND deleted_at IS NULL AND is_active
      UNION ALL
      SELECT p.id, p.${parent}, array_append(c.path, p.id), p.id = ANY(c.path), c.depth + 1
      FROM chain c JOIN ${table} p ON p.id = c.parent_id
      WHERE p.workspace_subdomain = ${tenant} AND p.deleted_at IS NULL AND p.is_active
        AND NOT c.cycle AND c.depth < 20
    ) SELECT id, parent_id, cycle, depth FROM chain
  `);
  const visited = new Set(result.rows.map((row) => row.id));
  if (!result.rows.length || result.rows.some((row) => row.id === id || row.cycle
    || (row.parent_id !== null && !visited.has(row.parent_id)))) {
    throw new Error('Invalid parent: missing ancestor, cycle, or hierarchy depth limit exceeded');
  }
}
