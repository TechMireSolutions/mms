import { describe, expect, it } from 'vitest';
import {
  computeNextTeacherEmployeeIdFromCount,
  findTeacherRegistrationConflict,
} from './teacherRegistrationUtils.js';

describe('computeNextTeacherEmployeeIdFromCount', () => {
  it('pads sequence from count', () => {
    expect(computeNextTeacherEmployeeIdFromCount(0, { idPrefix: 'TCH' })).toBe('TCH-0001');
    expect(computeNextTeacherEmployeeIdFromCount(3, { idPrefix: 'FAC' })).toBe('FAC-0004');
  });
});

describe('findTeacherRegistrationConflict', () => {
  const roster = [
    { id: 't1', contactId: 10, employeeId: 'TCH-0001' },
  ];

  it('detects contact conflict', () => {
    expect(findTeacherRegistrationConflict(roster, { contactId: 10 })).toBe('contact');
  });

  it('skips excluded id', () => {
    expect(
      findTeacherRegistrationConflict(roster, { excludeId: 't1', contactId: 10 }),
    ).toBeNull();
  });

  it('detects employeeId conflict (case-insensitive, trimmed)', () => {
    expect(findTeacherRegistrationConflict(roster, { employeeId: 'tch-0001 ' })).toBe(
      'employeeId',
    );
    expect(
      findTeacherRegistrationConflict(roster, {
        excludeId: 't1',
        employeeId: 'TCH-0001',
      }),
    ).toBeNull();
  });

  it('prioritises contact over employeeId', () => {
    const conflicted = [{ id: 't1', contactId: 10, employeeId: 'TCH-0002' }];
    expect(
      findTeacherRegistrationConflict(conflicted, { contactId: 10, employeeId: 'TCH-0002' }),
    ).toBe('contact');
  });

  it('returns null when no conflict', () => {
    expect(
      findTeacherRegistrationConflict(roster, { contactId: 11, employeeId: 'TCH-0099' }),
    ).toBeNull();
  });

  it('ignores soft-deleted rows', () => {
    const withDeleted = [
      { id: 't1', contactId: 10, employeeId: 'TCH-0001', deletedAt: '2026-07-01T00:00:00.000Z' },
    ];
    expect(findTeacherRegistrationConflict(withDeleted, { contactId: 10 })).toBeNull();
    expect(
      findTeacherRegistrationConflict(withDeleted, { employeeId: 'TCH-0001' }),
    ).toBeNull();
  });
});
