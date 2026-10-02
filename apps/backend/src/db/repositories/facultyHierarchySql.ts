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
  const edge = direction === 'up'
    ? sql`n.id = tree.reports_to_assignment_id`
    : sql`n.reports_to_assignment_id = tree.id`;
  return sql`
    WITH RECURSIVE eligible AS NOT MATERIALIZED (
      SELECT a.id, a.faculty_id, a.department_id, a.designation_id,
        a.reports_to_assignment_id, a.is_primary, a.start_date, a.end_date
      FROM faculty_assignments a
      JOIN faculty f ON f.workspace_subdomain = a.workspace_subdomain AND f.id = a.faculty_id
      JOIN faculty_departments d ON d.workspace_subdomain = a.workspace_subdomain AND d.id = a.department_id
      JOIN faculty_designations g ON g.workspace_subdomain = a.workspace_subdomain AND g.id = a.designation_id
      WHERE a.workspace_subdomain = ${tenant} AND a.deleted_at IS NULL
        AND f.deleted_at IS NULL AND d.deleted_at IS NULL AND g.deleted_at IS NULL
        ${period}
    ), tree AS (
      SELECT a.id, a.faculty_id, a.department_id, a.designation_id,
        a.reports_to_assignment_id, a.is_primary, a.start_date, a.end_date,
        0 AS depth, ARRAY[a.id] AS path, ARRAY[a.faculty_id] AS faculty_path, FALSE AS is_cycle
      FROM eligible a WHERE ${root}
      UNION ALL
      SELECT n.id, n.faculty_id, n.department_id, n.designation_id,
        n.reports_to_assignment_id, n.is_primary, n.start_date, n.end_date,
        tree.depth + 1, array_append(tree.path, n.id), array_append(tree.faculty_path, n.faculty_id),
        n.id = ANY(tree.path) OR n.faculty_id = ANY(tree.faculty_path)
      FROM eligible n JOIN tree ON ${edge}
      WHERE NOT tree.is_cycle AND tree.depth < ${maxDepth}
    )
    SELECT id, faculty_id AS "facultyId", department_id AS "departmentId",
      designation_id AS "designationId", reports_to_assignment_id AS "reportsToAssignmentId",
      is_primary AS "isPrimary", start_date::text AS "startDate", end_date::text AS "endDate",
      depth, path, is_cycle AS "isCycle"
    FROM tree WHERE depth > 0 ORDER BY depth, path
  `;
}
