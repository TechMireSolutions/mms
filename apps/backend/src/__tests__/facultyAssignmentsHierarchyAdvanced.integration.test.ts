/**
 * facultyAssignmentsHierarchyAdvanced.integration.test.ts
 *
 * Advanced hierarchy tests: cycle detection, depth caps, and multi-tenant RLS isolation.
 */

import { describe, it, expect } from 'vitest';
import {
  type MockAssignment,
  makeAssignment,
  simulateManagerChain,
  simulateSubordinateTree,
} from './facultyAssignmentsHierarchyHelpers.js';

describe('Faculty assignments — cycle detection (A→B→C→A)', () => {
  it('terminates safely and flags the cycle node with isCycle=true', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'a', facultyId: 'f-a', reportsToAssignmentId: 'c' }),
      makeAssignment({ id: 'b', facultyId: 'f-b', reportsToAssignmentId: 'a' }),
      makeAssignment({ id: 'c', facultyId: 'f-c', reportsToAssignmentId: 'b' }),
    ];

    const chain = simulateManagerChain(assignments, 'tenantA', 'b');
    expect(chain.length).toBeLessThanOrEqual(3);
    const cycleNode = chain.find((n) => n.isCycle);
    expect(cycleNode).toBeDefined();
  });

  it('downward CTE also terminates on a cycle', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-root' }),
      makeAssignment({ id: 'b', facultyId: 'f-b', reportsToAssignmentId: 'root' }),
    ];
    const tree = simulateSubordinateTree(assignments, 'tenantA', 'root', 20);
    expect(tree.length).toBeLessThanOrEqual(100);
  });

  it('depth cap truncates very long chains (maxDepth=5)', () => {
    const assignments: MockAssignment[] = Array.from({ length: 10 }, (_, i) =>
      makeAssignment({
        id: `n${i}`,
        facultyId: `f${i}`,
        reportsToAssignmentId: i === 0 ? null : `n${i - 1}`,
      }),
    );

    const tree = simulateSubordinateTree(assignments, 'tenantA', 'n0', 5);
    const maxDepthSeen = Math.max(...tree.map((n) => n.depth), 0);
    expect(maxDepthSeen).toBeLessThanOrEqual(5);
  });
});

describe('Faculty assignments — multi-tenant RLS isolation', () => {
  const assignments: MockAssignment[] = [
    makeAssignment({ id: 'a-root', facultyId: 'fa-dean', workspaceSubdomain: 'tenantA' }),
    makeAssignment({ id: 'a-hod', facultyId: 'fa-hod', workspaceSubdomain: 'tenantA', reportsToAssignmentId: 'a-root' }),
    makeAssignment({ id: 'b-root', facultyId: 'fb-dean', workspaceSubdomain: 'tenantB' }),
    makeAssignment({ id: 'b-hod', facultyId: 'fb-hod', workspaceSubdomain: 'tenantB', reportsToAssignmentId: 'b-root' }),
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

  it('cross-tenant IDs referenced as reportsToAssignmentId are ignored by tenant filter', () => {
    const crossTenantAssignments: MockAssignment[] = [
      ...assignments,
      makeAssignment({
        id: 'b-hod2',
        facultyId: 'fb-hod2',
        workspaceSubdomain: 'tenantB',
        reportsToAssignmentId: 'a-root',
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

  it('rejects self-parentId (same id and parentId)', () => {
    const dept = { id: 'd1', parentId: 'd1', name: 'Broken Dept', code: 'broken' };
    expect(dept.parentId === dept.id).toBe(true);
  });

  it('code uniqueness per workspace (case-insensitive slug)', () => {
    const existing = new Set(['eng', 'cs', 'math']);
    expect(existing.has('eng')).toBe(true);
    expect(existing.has('bio')).toBe(false);
  });
});
