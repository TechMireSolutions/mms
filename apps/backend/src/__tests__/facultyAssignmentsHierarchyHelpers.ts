/**
 * facultyAssignmentsHierarchyHelpers.ts
 *
 * Mock CTE simulators and fixtures for assignment hierarchy testing.
 */

import type { AssignmentTreeNode } from '../db/repositories/facultyAssignmentRepository.js';

export interface MockAssignment {
  id: string;
  workspaceSubdomain: string;
  facultyId: string;
  departmentId: string;
  designationId: string;
  reportsToAssignmentId: string | null;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
  deletedAt: Date | null;
}

export function simulateSubordinateTree(
  allAssignments: MockAssignment[],
  tenant: string,
  rootId: string,
  maxDepth = 20,
): AssignmentTreeNode[] {
  const active = allAssignments.filter(
    (a) => a.workspaceSubdomain === tenant && !a.deletedAt,
  );
  const results: AssignmentTreeNode[] = [];
  const queue: { node: MockAssignment; depth: number; path: string[] }[] = [];

  for (const a of active.filter((a) => a.reportsToAssignmentId === rootId)) {
    queue.push({ node: a, depth: 1, path: [rootId, a.id] });
  }

  let qHead = 0;
  while (qHead < queue.length) {
    const { node, depth, path } = queue[qHead++];
    const isCycle = path.slice(0, -1).includes(node.id);
    results.push({
      id: node.id,
      facultyId: node.facultyId,
      departmentId: node.departmentId,
      designationId: node.designationId,
      reportsToAssignmentId: node.reportsToAssignmentId,
      isPrimary: node.isPrimary,
      startDate: node.startDate,
      endDate: node.endDate,
      depth,
      path,
      isCycle,
    });
    if (isCycle || depth >= maxDepth) continue;
    for (const child of active.filter((a) => a.reportsToAssignmentId === node.id && !path.includes(a.id))) {
      queue.push({ node: child, depth: depth + 1, path: [...path, child.id] });
    }
  }
  return results;
}

export function simulateManagerChain(
  allAssignments: MockAssignment[],
  tenant: string,
  startId: string,
  maxDepth = 20,
): AssignmentTreeNode[] {
  const active = allAssignments.filter(
    (a) => a.workspaceSubdomain === tenant && !a.deletedAt,
  );
  const byId = new Map(active.map((a) => [a.id, a]));
  const start = byId.get(startId);
  if (!start?.reportsToAssignmentId) return [];

  const results: AssignmentTreeNode[] = [];
  const visited = new Set<string>([startId]);
  let current = byId.get(start.reportsToAssignmentId);
  let depth = 1;

  while (current && depth <= maxDepth) {
    const isCycle = visited.has(current.id);
    results.push({
      id: current.id,
      facultyId: current.facultyId,
      departmentId: current.departmentId,
      designationId: current.designationId,
      reportsToAssignmentId: current.reportsToAssignmentId,
      isPrimary: current.isPrimary,
      startDate: current.startDate,
      endDate: current.endDate,
      depth,
      path: [...visited, current.id],
      isCycle,
    });
    if (isCycle) break;
    visited.add(current.id);
    current = current.reportsToAssignmentId ? byId.get(current.reportsToAssignmentId) : undefined;
    depth++;
  }
  return results;
}

export function makeAssignment(
  overrides: Partial<MockAssignment> & Pick<MockAssignment, 'id' | 'facultyId'>,
): MockAssignment {
  return {
    workspaceSubdomain: 'tenantA',
    departmentId: 'dept-cs',
    designationId: 'des-lecturer',
    reportsToAssignmentId: null,
    isPrimary: false,
    startDate: '2024-01-01',
    endDate: null,
    deletedAt: null,
    ...overrides,
  };
}
