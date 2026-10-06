import { sql } from 'drizzle-orm';
import { facultyAssignmentSchema } from '@mms/shared';

export function validateHierarchyDepth(maxDepth: number): void {
  if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 20) {
    throw new Error('Hierarchy depth must be an integer between 1 and 20');
  }
}

export function assignmentHierarchySql(
  tenant: string,
  assignmentId: string,
  direction: 'up' | 'down',
  maxDepth: number,
  options: { facultyId?: string; onDate?: string } = {},
) {
  validateHierarchyDepth(maxDepth);
  if (options.onDate !== undefined) facultyAssignmentSchema.shape.startDate.parse(options.onDate);
  const root = options.facultyId ? sql`a.faculty_id = ${options.facultyId}` : sql`a.id = ${assignmentId}`;
  const period = options.onDate
    ? sql`AND a.start_date <= ${options.onDate}::date AND (a.end_date IS NULL OR a.end_date >= ${options.onDate}::date)`
    : sql``;
  const upEdge = sql`
    JOIN organization_positions pos
      ON pos.workspace_subdomain = tree.workspace_subdomain
      AND pos.id = tree.position_id
      AND pos.deleted_at IS NULL
    JOIN eligible n
      ON n.workspace_subdomain = tree.workspace_subdomain
      AND n.position_id = pos.parent_position_id
  `;
  const downEdge = sql`
    JOIN organization_positions child_pos
      ON child_pos.workspace_subdomain = tree.workspace_subdomain
      AND child_pos.parent_position_id = tree.position_id
      AND child_pos.deleted_at IS NULL
    JOIN eligible n
      ON n.workspace_subdomain = tree.workspace_subdomain
      AND n.position_id = child_pos.id
  `;
  const edge = direction === 'up' ? upEdge : downEdge;
  return sql`
    WITH RECURSIVE eligible AS NOT MATERIALIZED (
      SELECT a.id, a.faculty_id, a.department_id, a.designation_id,
        a.position_id, a.is_primary, a.start_date, a.end_date,
        a.workspace_subdomain
      FROM faculty_assignments a
      JOIN faculty f ON f.workspace_subdomain = a.workspace_subdomain AND f.id = a.faculty_id
      JOIN faculty_departments d ON d.workspace_subdomain = a.workspace_subdomain AND d.id = a.department_id
      JOIN faculty_designations g ON g.workspace_subdomain = a.workspace_subdomain AND g.id = a.designation_id
      WHERE a.workspace_subdomain = ${tenant} AND a.deleted_at IS NULL
        AND a.position_id IS NOT NULL
        AND a.is_primary = true
        AND a.status = 'active'
        AND f.deleted_at IS NULL AND d.deleted_at IS NULL AND g.deleted_at IS NULL
        ${period}
    ), tree AS (
      SELECT a.id, a.faculty_id, a.department_id, a.designation_id,
        a.position_id, a.is_primary, a.start_date, a.end_date, a.workspace_subdomain,
        0 AS depth, ARRAY[a.id] AS path, ARRAY[a.faculty_id] AS faculty_path, FALSE AS is_cycle
      FROM eligible a WHERE ${root}
      UNION ALL
      SELECT n.id, n.faculty_id, n.department_id, n.designation_id,
        n.position_id, n.is_primary, n.start_date, n.end_date, n.workspace_subdomain,
        tree.depth + 1, array_append(tree.path, n.id), array_append(tree.faculty_path, n.faculty_id),
        n.id = ANY(tree.path) OR n.faculty_id = ANY(tree.faculty_path)
      FROM tree
      ${edge}
      WHERE NOT tree.is_cycle AND tree.depth < ${maxDepth}
        AND n.position_id IS NOT NULL
    )
    SELECT
      tree.id,
      tree.faculty_id AS "facultyId",
      tree.department_id AS "departmentId",
      tree.designation_id AS "designationId",
      tree.is_primary AS "isPrimary",
      tree.start_date::text AS "startDate",
      tree.end_date::text AS "endDate",
      tree.depth,
      tree.path,
      tree.is_cycle AS "isCycle",
      COALESCE(
        NULLIF(TRIM(c.name), ''),
        NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''),
        fe_emp.employee_id,
        tree.faculty_id
      ) AS "facultyName"
    FROM tree
    JOIN faculty f
      ON f.workspace_subdomain = tree.workspace_subdomain
      AND f.id = tree.faculty_id
    LEFT JOIN faculty_employments fe_emp
      ON fe_emp.workspace_subdomain = f.workspace_subdomain
      AND fe_emp.id = f.employment_id
      AND fe_emp.deleted_at IS NULL
    LEFT JOIN contacts c
      ON c.workspace_subdomain = fe_emp.workspace_subdomain
      AND c.id = fe_emp.contact_id
      AND c.deleted_at IS NULL
    WHERE tree.depth > 0
    ORDER BY tree.depth, tree.path
  `;
}
