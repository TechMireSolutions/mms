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
  it('allows faculty-form bootstrap creates without an organization position', async () => {
    // Arrange — create path (no existing row) with active faculty/dept/designation
    assignmentQueries();

    // Act + Assert
    await expect(validateFacultyAssignment(tx, 'tenant', input)).resolves.toBeUndefined();
  });

  it('allows updating a legacy appointment that still lacks a position', async () => {
    // Arrange — update path preserves null positionId until ops backfill
    tx.execute
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ faculty_id: 'f', deleted_at: null, position_id: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 'f' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'd' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'g' }] });

    // Act + Assert
    await expect(validateFacultyAssignment(tx, 'tenant', input)).resolves.toBeUndefined();
  });

  it('rejects clearing positionId on update when the appointment already has one', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ faculty_id: 'f', deleted_at: null, position_id: 'pos-1' }] });

    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, positionId: null }),
    ).rejects.toThrow('Cannot clear organization position');
  });

  it('allows a secondary role without checking primary overlaps', async () => {
    assignmentQueries();
    tx.execute
      .mockResolvedValueOnce({
        rows: [{ id: 'pos-1', capacity: 2, department_id: 'd', designation_id: 'g' }],
      })
      .mockResolvedValueOnce({ rows: [{ peak: 1 }] });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, positionId: 'pos-1' }),
    ).resolves.toBeUndefined();
  });

  it('rejects a primary promotion when another period overlaps', async () => {
    assignmentQueries();
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 'existing-primary' }] });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, isPrimary: true, positionId: 'pos-1' }),
    ).rejects.toThrow('overlaps');
  });

  it('rejects archived assignments instead of resurrecting them through upsert', async () => {
    tx.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ faculty_id: 'f', deleted_at: new Date() }] });
    await expect(validateFacultyAssignment(tx, 'tenant', input)).rejects.toThrow('archived');
  });

  it('rejects assignments when the department is inactive', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [] }) // tenant lock
      .mockResolvedValueOnce({ rows: [] }) // existing assignment
      .mockResolvedValueOnce({ rows: [{ id: 'f' }] })
      .mockResolvedValueOnce({ rows: [] }) // inactive / missing department (is_active filter)
      .mockResolvedValueOnce({ rows: [{ id: 'g' }] });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, positionId: 'pos-1' }),
    ).rejects.toThrow('must be active');
  });

  it('rejects position occupancy when department or designation mismatches the position', async () => {
    assignmentQueries();
    tx.execute.mockResolvedValueOnce({
      rows: [{ id: 'pos-1', capacity: 1, department_id: 'other-dept', designation_id: 'g' }],
    });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, positionId: 'pos-1' }),
    ).rejects.toThrow('must match its position');
  });

  it('rejects position occupancy when capacity would be exceeded', async () => {
    assignmentQueries();
    tx.execute
      .mockResolvedValueOnce({
        rows: [{ id: 'pos-1', capacity: 1, department_id: 'd', designation_id: 'g' }],
      })
      .mockResolvedValueOnce({ rows: [{ peak: 2 }] });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, positionId: 'pos-1' }),
    ).rejects.toThrow('capacity would be exceeded');
  });

  it('allows a second concurrent assignment for the same faculty on a different position', async () => {
    assignmentQueries();
    tx.execute
      .mockResolvedValueOnce({
        rows: [{ id: 'pos-2', capacity: 2, department_id: 'd', designation_id: 'g' }],
      })
      .mockResolvedValueOnce({ rows: [{ peak: 1 }] });
    await expect(
      validateFacultyAssignment(tx, 'tenant', { ...input, id: 'a2', positionId: 'pos-2', isPrimary: false }),
    ).resolves.toBeUndefined();
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
