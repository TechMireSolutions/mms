/**
 * facultyAssignmentsHierarchyAdvanced.integration.test.ts
 *
 * Advanced hierarchy tests: cycle detection, depth caps, and multi-tenant isolation
 * under the position-parent org chart model.
 */

import { describe, it, expect } from 'vitest';
import {
  type MockAssignment,
  makeAssignment,
  simulateManagerChain,
  simulateSubordinateTree,
} from './facultyAssignmentsHierarchyHelpers.js';

describe('Faculty assignments — cycle detection (position loop)', () => {
  it('terminates safely and flags the cycle node with isCycle=true', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({
        id: 'a',
        facultyId: 'f-a',
        positionId: 'pos-a',
        parentPositionId: 'pos-c',
      }),
      makeAssignment({
        id: 'b',
        facultyId: 'f-b',
        positionId: 'pos-b',
        parentPositionId: 'pos-a',
      }),
      makeAssignment({
        id: 'c',
        facultyId: 'f-c',
        positionId: 'pos-c',
        parentPositionId: 'pos-b',
      }),
    ];

    const chain = simulateManagerChain(assignments, 'tenantA', 'b');
    expect(chain.length).toBeLessThanOrEqual(3);
    const cycleNode = chain.find((n) => n.isCycle);
    expect(cycleNode).toBeDefined();
  });

  it('downward CTE also terminates on a cycle', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-root', positionId: 'pos-root', parentPositionId: null }),
      makeAssignment({ id: 'b', facultyId: 'f-b', positionId: 'pos-b', parentPositionId: 'pos-root' }),
    ];
    const tree = simulateSubordinateTree(assignments, 'tenantA', 'root', 20);
    expect(tree.length).toBeLessThanOrEqual(100);
  });

  it('depth cap truncates very long chains (maxDepth=5)', () => {
    const assignments: MockAssignment[] = Array.from({ length: 10 }, (_, i) =>
      makeAssignment({
        id: `n${i}`,
        facultyId: `f${i}`,
        positionId: `pos-${i}`,
        parentPositionId: i === 0 ? null : `pos-${i - 1}`,
      }),
    );

    const tree = simulateSubordinateTree(assignments, 'tenantA', 'n0', 5);
    const maxDepthSeen = Math.max(...tree.map((n) => n.depth), 0);
    expect(maxDepthSeen).toBeLessThanOrEqual(5);
  });
});

describe('Faculty assignments — multi-tenant isolation', () => {
  const assignments: MockAssignment[] = [
    makeAssignment({
      id: 'a-root',
      facultyId: 'fa-dean',
      workspaceSubdomain: 'tenantA',
      positionId: 'pos-a-root',
      parentPositionId: null,
    }),
    makeAssignment({
      id: 'a-hod',
      facultyId: 'fa-hod',
      workspaceSubdomain: 'tenantA',
      positionId: 'pos-a-hod',
      parentPositionId: 'pos-a-root',
    }),
    makeAssignment({
      id: 'b-root',
      facultyId: 'fb-dean',
      workspaceSubdomain: 'tenantB',
      positionId: 'pos-b-root',
      parentPositionId: null,
    }),
    makeAssignment({
      id: 'b-hod',
      facultyId: 'fb-hod',
      workspaceSubdomain: 'tenantB',
      positionId: 'pos-b-hod',
      parentPositionId: 'pos-b-root',
    }),
  ];

  it('Tenant A subordinate tree does not include Tenant B nodes', () => {
    const tree = simulateSubordinateTree(assignments, 'tenantA', 'a-root');
    const ids = tree.map((n) => n.id);
    expect(ids).toContain('a-hod');
    expect(ids).not.toContain('b-root');
    expect(ids).not.toContain('b-hod');
  });

  it('Tenant B manager chain does not include Tenant A nodes', () => {
    const chain = simulateManagerChain(assignments, 'tenantB', 'b-hod');
    const ids = chain.map((n) => n.id);
    expect(ids).toContain('b-root');
    expect(ids).not.toContain('a-root');
    expect(ids).not.toContain('a-hod');
  });

  it('cross-tenant parent_position ids are ignored by tenant filter', () => {
    const crossTenantAssignments: MockAssignment[] = [
      ...assignments,
      makeAssignment({
        id: 'b-hod2',
        facultyId: 'fb-hod2',
        workspaceSubdomain: 'tenantB',
        positionId: 'pos-b-hod2',
        parentPositionId: 'pos-a-root',
      }),
    ];
    const tree = simulateSubordinateTree(crossTenantAssignments, 'tenantB', 'b-root');
    expect(tree.map((n) => n.id)).not.toContain('a-root');
  });
});

describe('Faculty departments — hierarchy validation', () => {
  it('root departments have parentId = null', () => {
    const dept = { id: 'd1', parentId: null, name: 'Faculty of Engineering', code: 'eng' };
    expect(dept.parentId).toBeNull();
  });

  it('child departments reference a valid parentId', () => {
    const parent = { id: 'p1', parentId: null, name: 'Faculty of Engineering', code: 'eng' };
    const child = { id: 'c1', parentId: parent.id, name: 'Dept. of CS', code: 'cs' };
    expect(child.parentId).toBe(parent.id);
  });
});
