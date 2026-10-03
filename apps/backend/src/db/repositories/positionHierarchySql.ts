/**
 * @file positionHierarchySql.ts
 * @description Recursive CTE queries for organization position hierarchy traversal and cycle detection.
 */

import { sql } from 'drizzle-orm';

export function validateHierarchyDepth(maxDepth: number): void {
  if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 20) {
    throw new Error('Hierarchy depth must be an integer between 1 and 20');
  }
}

export function positionHierarchySql(
  tenant: string,
  positionId: string,
  direction: 'up' | 'down',
  maxDepth = 20,
) {
  validateHierarchyDepth(maxDepth);
  const edge = direction === 'up'
    ? sql`n.id = tree.parent_position_id`
    : sql`n.parent_position_id = tree.id`;

  return sql`
    WITH RECURSIVE eligible AS NOT MATERIALIZED (
      SELECT p.id, p.code, p.name, p.department_id, p.designation_id,
             p.location_id, p.parent_position_id, p.capacity
      FROM organization_positions p
      WHERE p.workspace_subdomain = ${tenant} AND p.deleted_at IS NULL
    ), tree AS (
      SELECT p.id, p.code, p.name, p.department_id, p.designation_id,
             p.location_id, p.parent_position_id, p.capacity,
             0 AS depth, ARRAY[p.id] AS path, FALSE AS is_cycle
      FROM eligible p WHERE p.id = ${positionId}
      UNION ALL
      SELECT n.id, n.code, n.name, n.department_id, n.designation_id,
             n.location_id, n.parent_position_id, n.capacity,
             tree.depth + 1, array_append(tree.path, n.id),
             n.id = ANY(tree.path)
      FROM eligible n JOIN tree ON ${edge}
      WHERE NOT tree.is_cycle AND tree.depth < ${maxDepth}
    )
    SELECT id::text AS "id", code, name, department_id AS "departmentId",
           designation_id AS "designationId", location_id::text AS "locationId",
           parent_position_id::text AS "parentPositionId", capacity,
           depth, path, is_cycle AS "isCycle"
    FROM tree WHERE depth > 0 ORDER BY depth, path
  `;
}
