import { sql } from 'drizzle-orm';
import { withTenantRead } from '../tenant-context.js';

export interface AssignmentTreeNode {
  id: string;
  facultyId: string;
  departmentId: string;
  designationId: string;
  reportsToAssignmentId: string | null;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
  depth: number;
  path: string[];
  isCycle: boolean;
}

function mapAssignmentTreeNode(r: Record<string, unknown>): AssignmentTreeNode {
  return {
    id: r.id as string,
    facultyId: r.faculty_id as string,
    departmentId: r.department_id as string,
    designationId: r.designation_id as string,
    reportsToAssignmentId: (r.reports_to_assignment_id as string | null) ?? null,
    isPrimary: Boolean(r.is_primary),
    startDate: r.start_date as string,
    endDate: (r.end_date as string | null) ?? null,
    depth: Number(r.depth),
    path: r.path as string[],
    isCycle: Boolean(r.is_cycle),
  };
}

/**
 * Upward traversal: traverses the `reports_to_assignment_id` chain to surface
 * manager assignments up to the organisational apex or maxDepth.
 */
export async function findAssignmentManagerChain(
  tenant: string,
  assignmentId: string,
  maxDepth = 20,
): Promise<AssignmentTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<Record<string, unknown>>(sql`
      WITH RECURSIVE manager_chain AS (
        SELECT
          a.id, a.faculty_id, a.department_id, a.designation_id,
          a.reports_to_assignment_id, a.is_primary, a.start_date, a.end_date,
          1 AS depth, ARRAY[a.id] AS path, FALSE AS is_cycle
        FROM faculty_assignments a
        WHERE a.workspace_subdomain = ${subdomain}
          AND a.id = (
            SELECT reports_to_assignment_id FROM faculty_assignments
            WHERE workspace_subdomain = ${subdomain} AND id = ${assignmentId} AND deleted_at IS NULL
          )
          AND a.deleted_at IS NULL
        UNION ALL
        SELECT
          p.id, p.faculty_id, p.department_id, p.designation_id,
          p.reports_to_assignment_id, p.is_primary, p.start_date, p.end_date,
          mc.depth + 1, mc.path || p.id, p.id = ANY(mc.path)
        FROM faculty_assignments p
        INNER JOIN manager_chain mc ON mc.reports_to_assignment_id = p.id
        WHERE p.workspace_subdomain = ${subdomain} AND p.deleted_at IS NULL
          AND NOT (p.id = ANY(mc.path)) AND mc.depth < ${maxDepth} AND NOT mc.is_cycle
      )
      SELECT id, faculty_id, department_id, designation_id, reports_to_assignment_id,
             is_primary, start_date, end_date, depth, path, is_cycle
      FROM manager_chain ORDER BY depth
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map(mapAssignmentTreeNode);
  });
}

/**
 * Downward traversal: retrieves the entire subordinate subtree reporting to rootAssignmentId.
 */
export async function findAssignmentSubordinateTree(
  tenant: string,
  rootAssignmentId: string,
  maxDepth = 20,
): Promise<AssignmentTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<Record<string, unknown>>(sql`
      WITH RECURSIVE subordinate_tree AS (
        SELECT
          a.id, a.faculty_id, a.department_id, a.designation_id,
          a.reports_to_assignment_id, a.is_primary, a.start_date, a.end_date,
          1 AS depth, ARRAY[${rootAssignmentId}::text, a.id] AS path, FALSE AS is_cycle
        FROM faculty_assignments a
        WHERE a.workspace_subdomain = ${subdomain}
          AND a.reports_to_assignment_id = ${rootAssignmentId}
          AND a.deleted_at IS NULL
        UNION ALL
        SELECT
          c.id, c.faculty_id, c.department_id, c.designation_id,
          c.reports_to_assignment_id, c.is_primary, c.start_date, c.end_date,
          st.depth + 1, st.path || c.id, c.id = ANY(st.path)
        FROM faculty_assignments c
        INNER JOIN subordinate_tree st ON c.reports_to_assignment_id = st.id
        WHERE c.workspace_subdomain = ${subdomain} AND c.deleted_at IS NULL
          AND NOT (c.id = ANY(st.path)) AND st.depth < ${maxDepth} AND NOT st.is_cycle
      )
      SELECT id, faculty_id, department_id, designation_id, reports_to_assignment_id,
             is_primary, start_date, end_date, depth, path, is_cycle
      FROM subordinate_tree ORDER BY depth, id
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map(mapAssignmentTreeNode);
  });
}

/** Validates that setting reports_to_assignment_id = parentId does not create a cycle. */
export async function checkAssignmentCycleSafe(
  tenant: string,
  childId: string,
  parentId: string,
  maxDepth = 20,
): Promise<boolean> {
  if (childId === parentId) return false;
  const ancestors = await findAssignmentManagerChain(tenant, childId, maxDepth);
  return !ancestors.some((a) => a.id === parentId || a.isCycle);
}
