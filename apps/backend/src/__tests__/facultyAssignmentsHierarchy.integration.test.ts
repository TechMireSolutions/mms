/**
 * facultyAssignmentsHierarchy.integration.test.ts
 *
 * Traversal tests for downward subordinate trees and upward manager chains.
 */

import { describe, it, expect } from 'vitest';
import {
  type MockAssignment,
  makeAssignment,
  simulateManagerChain,
  simulateSubordinateTree,
} from './facultyAssignmentsHierarchyHelpers.js';

describe('Faculty assignments — downward subordinate tree', () => {
  it('returns direct reports at depth 1', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-dean', isPrimary: true }),
      makeAssignment({ id: 'hod1', facultyId: 'f-hod1', reportsToAssignmentId: 'root' }),
      makeAssignment({ id: 'hod2', facultyId: 'f-hod2', reportsToAssignmentId: 'root' }),
    ];

    const tree = simulateSubordinateTree(assignments, 'tenantA', 'root');
    expect(tree.filter((n) => n.depth === 1).map((n) => n.id).sort()).toEqual(['hod1', 'hod2'].sort());
  });

  it('returns nested subordinates at correct depths', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-dean' }),
      makeAssignment({ id: 'hod', facultyId: 'f-hod', reportsToAssignmentId: 'root' }),
      makeAssignment({ id: 'lect', facultyId: 'f-lect', reportsToAssignmentId: 'hod' }),
      makeAssignment({ id: 'asst', facultyId: 'f-asst', reportsToAssignmentId: 'lect' }),
    ];

    const tree = simulateSubordinateTree(assignments, 'tenantA', 'root');
    expect(tree.find((n) => n.id === 'hod')?.depth).toBe(1);
    expect(tree.find((n) => n.id === 'lect')?.depth).toBe(2);
    expect(tree.find((n) => n.id === 'asst')?.depth).toBe(3);
  });

  it('excludes soft-deleted assignments from traversal', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-dean' }),
      makeAssignment({ id: 'hod', facultyId: 'f-hod', reportsToAssignmentId: 'root', deletedAt: new Date() }),
      makeAssignment({ id: 'lect', facultyId: 'f-lect', reportsToAssignmentId: 'hod' }),
    ];

    const tree = simulateSubordinateTree(assignments, 'tenantA', 'root');
    expect(tree.map((n) => n.id)).not.toContain('hod');
    expect(tree.map((n) => n.id)).not.toContain('lect');
  });

  it('returns empty array when root has no direct reports', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-dean' }),
    ];
    expect(simulateSubordinateTree(assignments, 'tenantA', 'root')).toHaveLength(0);
  });
});

describe('Faculty assignments — upward manager chain', () => {
  it('returns immediate supervisor at depth 1', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'dean-asgn', facultyId: 'f-dean' }),
      makeAssignment({ id: 'hod-asgn', facultyId: 'f-hod', reportsToAssignmentId: 'dean-asgn' }),
    ];

    const chain = simulateManagerChain(assignments, 'tenantA', 'hod-asgn');
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe('dean-asgn');
    expect(chain[0].depth).toBe(1);
  });

  it('surfaces the full chain: lecturer → HoD → Dean', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'dean-asgn', facultyId: 'f-dean' }),
      makeAssignment({ id: 'hod-asgn', facultyId: 'f-hod', reportsToAssignmentId: 'dean-asgn' }),
      makeAssignment({ id: 'lect-asgn', facultyId: 'f-lect', reportsToAssignmentId: 'hod-asgn' }),
    ];

    const chain = simulateManagerChain(assignments, 'tenantA', 'lect-asgn');
    expect(chain.map((n) => n.id)).toEqual(['hod-asgn', 'dean-asgn']);
    expect(chain[0].depth).toBe(1);
    expect(chain[1].depth).toBe(2);
  });

  it('returns empty for root assignment with no supervisor', () => {
    const assignments: MockAssignment[] = [
      makeAssignment({ id: 'root', facultyId: 'f-root', reportsToAssignmentId: null }),
    ];
    expect(simulateManagerChain(assignments, 'tenantA', 'root')).toHaveLength(0);
  });
});
