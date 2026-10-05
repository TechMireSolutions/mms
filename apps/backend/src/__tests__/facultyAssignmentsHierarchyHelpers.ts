/**
 * facultyAssignmentsHierarchyHelpers.ts
 *
 * In-memory simulators for position-parent assignment hierarchy (org chart SSOT).
 */

import type { AssignmentTreeNode } from '../db/repositories/facultyAssignmentRepository.js';

export interface MockAssignment {
  id: string;
  workspaceSubdomain: string;
  facultyId: string;
  departmentId: string;
  designationId: string;
  positionId: string | null;
  /** Position this assignment occupies reports to (parent_position_id). */
  parentPositionId: string | null;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
  deletedAt: Date | null;
}

function activePrimary(all: MockAssignment[], tenant: string): MockAssignment[] {
  return all.filter(
    (a) =>
      a.workspaceSubdomain === tenant
      && !a.deletedAt
      && a.isPrimary
      && a.positionId != null,
  );
}

export function simulateSubordinateTree(
  allAssignments: MockAssignment[],
  tenant: string,
  rootId: string,
  maxDepth = 20,
): AssignmentTreeNode[] {
  const active = activePrimary(allAssignments, tenant);
  const root = active.find((a) => a.id === rootId);
  if (!root?.positionId) return [];

  const results: AssignmentTreeNode[] = [];
  const queue: { node: MockAssignment; depth: number; path: string[] }[] = [];

  for (const child of active.filter((a) => a.parentPositionId === root.positionId)) {
    queue.push({ node: child, depth: 1, path: [rootId, child.id] });
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
      isPrimary: node.isPrimary,
      startDate: node.startDate,
      endDate: node.endDate,
      depth,
      path,
      isCycle,
    });
    if (isCycle || depth >= maxDepth || !node.positionId) continue;
    for (const child of active.filter(
      (a) => a.parentPositionId === node.positionId && !path.includes(a.id),
    )) {
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
  const active = activePrimary(allAssignments, tenant);
  const byPosition = new Map(
    active.filter((a) => a.positionId).map((a) => [a.positionId!, a]),
  );
  const start = active.find((a) => a.id === startId);
  if (!start?.parentPositionId) return [];

  const results: AssignmentTreeNode[] = [];
  const visited = new Set<string>([startId]);
  let current = byPosition.get(start.parentPositionId);
  let depth = 1;

  while (current && depth <= maxDepth) {
    const isCycle = visited.has(current.id);
    results.push({
      id: current.id,
      facultyId: current.facultyId,
      departmentId: current.departmentId,
      designationId: current.designationId,
      isPrimary: current.isPrimary,
      startDate: current.startDate,
      endDate: current.endDate,
      depth,
      path: [...visited, current.id],
      isCycle,
    });
    if (isCycle) break;
    visited.add(current.id);
    current = current.parentPositionId
      ? byPosition.get(current.parentPositionId)
      : undefined;
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
    positionId: overrides.positionId ?? `pos-${overrides.id}`,
    parentPositionId: null,
    isPrimary: true,
    startDate: '2024-01-01',
    endDate: null,
    deletedAt: null,
    ...overrides,
  };
}
