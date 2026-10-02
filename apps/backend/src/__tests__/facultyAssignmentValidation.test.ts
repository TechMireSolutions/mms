import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateFacultyAssignment } from '../db/repositories/facultyAssignmentValidation.js';
import { validateFacultyDepartment } from '../db/repositories/facultyDepartmentValidation.js';
import { validateHierarchyDepth } from '../db/repositories/facultyHierarchySql.js';

const tx = { execute: vi.fn() };
const input = { id: 'a', workspaceSubdomain: 'tenant', facultyId: 'f', departmentId: 'd', designationId: 'g', startDate: '2024-01-01' };
beforeEach(() => tx.execute.mockReset());

function assignmentQueries() {
  tx.execute.mockResolvedValueOnce({ rows: [] }) // tenant lock
    .mockResolvedValueOnce({ rows: [] }) // existing assignment
    .mockResolvedValueOnce({ rows: [{ id: 'f' }] })
    .mockResolvedValueOnce({ rows: [{ id: 'd' }] })
    .mockResolvedValueOnce({ rows: [{ id: 'g' }] });
}

describe('Faculty assignment production validation', () => {
  it('allows a secondary role without checking primary overlaps', async () => {
    assignmentQueries();
    await expect(validateFacultyAssignment(tx, 'tenant', input)).resolves.toBeUndefined();
    expect(tx.execute).toHaveBeenCalledTimes(5);
  });

  it('rejects a primary promotion when another period overlaps', async () => {
    assignmentQueries();
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 'existing-primary' }] });
    await expect(validateFacultyAssignment(tx, 'tenant', { ...input, isPrimary: true })).rejects.toThrow('overlaps');
  });

  it('rejects a reporting chain that is still open at the depth limit', async () => {
    assignmentQueries();
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 'parent', faculty_id: 'parent-person', reports_to_assignment_id: 'far' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'far', facultyId: 'other', reportsToAssignmentId: 'further', depth: 20, isCycle: false }] });
    await expect(validateFacultyAssignment(tx, 'tenant', { ...input, reportsToAssignmentId: 'parent' })).rejects.toThrow('depth limit');
  });

  it('rejects a repeated person even when assignment IDs differ', async () => {
    assignmentQueries();
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 'different', faculty_id: 'f', depth: 0, cycle: false }] });
    await expect(validateFacultyAssignment(tx, 'tenant', { ...input, reportsToAssignmentId: 'different' })).rejects.toThrow('Circular');
  });

  it('rejects archived assignments instead of resurrecting them through upsert', async () => {
    tx.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ faculty_id: 'f', deleted_at: new Date() }] });
    await expect(validateFacultyAssignment(tx, 'tenant', input)).rejects.toThrow('archived');
  });
});

describe('Faculty department production validation', () => {
  it('rejects parent chains that return to the child', async () => {
    tx.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'd', parent_id: null, depth: 2, cycle: false }] });
    await expect(validateFacultyDepartment(tx, 'tenant', {
      id: 'd', workspaceSubdomain: 'tenant', parentId: 'child', name: 'Dept', code: 'D',
    })).rejects.toThrow('Circular');
  });

  it.each([0, -1, 21, NaN, Infinity, 1.1])('rejects unsafe depth %s', (depth) => {
    expect(() => validateHierarchyDepth(depth)).toThrow('Hierarchy depth');
  });
});
