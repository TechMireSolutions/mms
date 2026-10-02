import { assignmentHierarchySql } from './facultyHierarchySql.js';
import { withTenantRead } from '../tenant-context.js';

export type { FacultyAssignmentTreeNode as AssignmentTreeNode } from '@mms/shared';
import type { FacultyAssignmentTreeNode as AssignmentTreeNode } from '@mms/shared';

/**
 * Upward traversal: traverses the `reports_to_assignment_id` chain to surface
 * manager assignments up to the organisational apex or maxDepth.
 */
export async function findAssignmentManagerChain(
  tenant: string,
  assignmentId: string,
  maxDepth = 20,
  onDate?: string,
): Promise<AssignmentTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const result = await tx.execute<AssignmentTreeNode & Record<string, unknown>>(
      assignmentHierarchySql(subdomain, assignmentId, 'up', maxDepth, { onDate }),
    );
    return result.rows;
  });
}

/**
 * Downward traversal: retrieves the entire subordinate subtree reporting to rootAssignmentId.
 */
export async function findAssignmentSubordinateTree(
  tenant: string,
  rootAssignmentId: string,
  maxDepth = 20,
  onDate?: string,
): Promise<AssignmentTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const result = await tx.execute<AssignmentTreeNode & Record<string, unknown>>(
      assignmentHierarchySql(subdomain, rootAssignmentId, 'down', maxDepth, { onDate }),
    );
    return result.rows;
  });
}

export async function findFacultyManagerChain(
  tenant: string, facultyId: string, onDate: string, maxDepth = 20,
): Promise<AssignmentTreeNode[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const result = await tx.execute<AssignmentTreeNode & Record<string, unknown>>(
      assignmentHierarchySql(subdomain, '', 'up', maxDepth, { facultyId, onDate }),
    );
    return result.rows;
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
  const ancestors = await findAssignmentManagerChain(tenant, parentId, maxDepth);
  return !ancestors.some((a) => a.id === childId || a.isCycle || (a.depth === maxDepth && a.reportsToAssignmentId !== null));
}
