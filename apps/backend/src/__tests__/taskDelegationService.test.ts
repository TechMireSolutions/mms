import { describe, expect, it } from 'vitest';
import { resolveTaskRecipients } from '../services/taskDelegationService.js';
import type { TaskRecipientRow } from '../db/repositories/taskRecipientRepository.js';

function recipient(overrides: Partial<TaskRecipientRow> = {}): TaskRecipientRow {
  return { facultyId: 'staff', name: 'Staff', employeeId: 'E1', assignmentId: 'assignment',
    positionId: 'position', positionName: 'Officer', departmentName: 'IT', userId: 'user',
    isSelf: false, ...overrides };
}

describe('Task recipient authorization', () => {
  it.each([
    { facultyId: 'other' },
    { facultyId: 'staff', positionId: 'forged' },
    { facultyId: 'staff', facultyAssignmentId: 'forged' },
    { facultyId: 'staff', userId: 'forged' },
  ])('given a forged recipient tuple, should reject assignment when resolving %j', (input) => {
    // Arrange
    const rows = [recipient()];

    // Act
    const result = resolveTaskRecipients([input], rows);

    // Assert
    expect(result).toEqual({ valid: false, resolvedAssignees: [],
      reason: 'Recipient is not eligible for this assignment' });
  });

  it('given multiple appointments, should resolve the matching eligible appointment when selected', () => {
    // Arrange
    const rows = [recipient(), recipient({ assignmentId: 'second', positionId: 'second-position' })];

    // Act
    const result = resolveTaskRecipients([{ facultyId: 'staff', facultyAssignmentId: 'second' }], rows);

    // Assert
    expect(result).toEqual({ valid: true, resolvedAssignees: [{ facultyId: 'staff',
      facultyAssignmentId: 'second', positionId: 'second-position', userId: 'user' }] });
  });

  it('given individually valid IDs from different appointments, should reject a mixed tuple', () => {
    // Arrange
    const rows = [recipient(), recipient({ assignmentId: 'second', positionId: 'second-position' })];

    // Act
    const result = resolveTaskRecipients([{ facultyId: 'staff', facultyAssignmentId: 'second',
      positionId: 'position' }], rows);

    // Assert
    expect(result.valid).toBe(false);
    expect(result.resolvedAssignees).toEqual([]);
  });

  it('given duplicate recipients, should return one recipient per login when resolving', () => {
    // Arrange
    const input = { facultyId: 'staff' };

    // Act
    const result = resolveTaskRecipients([input, input], [recipient()]);

    // Assert
    expect(result.resolvedAssignees).toHaveLength(1);
  });

  it('given one ineligible recipient, should reject the whole batch when resolving', () => {
    // Arrange
    const inputs = [{ facultyId: 'staff' }, { facultyId: 'ineligible' }];

    // Act
    const result = resolveTaskRecipients(inputs, [recipient()]);

    // Assert
    expect(result.valid).toBe(false);
    expect(result.resolvedAssignees).toEqual([]);
  });

  it('given a self recipient row, should resolve when present in the eligible set', () => {
    // Arrange
    const rows = [recipient({ facultyId: 'me', userId: 'me-user', isSelf: true })];

    // Act
    const result = resolveTaskRecipients([{ facultyId: 'me', userId: 'me-user' }], rows);

    // Assert
    expect(result.valid).toBe(true);
    expect(result.resolvedAssignees).toEqual([{
      facultyId: 'me', facultyAssignmentId: 'assignment', positionId: 'position', userId: 'me-user',
    }]);
  });

  it('given text faculty ids, should accept non-uuid assignee inputs at the resolver boundary', () => {
    // Arrange
    const rows = [recipient({ facultyId: 'fac-legacy-1', userId: 'user-legacy-1' })];

    // Act
    const result = resolveTaskRecipients([{ facultyId: 'fac-legacy-1' }], rows);

    // Assert
    expect(result.valid).toBe(true);
    expect(result.resolvedAssignees[0]?.facultyId).toBe('fac-legacy-1');
  });
});
