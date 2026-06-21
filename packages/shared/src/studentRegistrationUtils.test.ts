import { describe, expect, it } from 'vitest';
import {
  collectStudentLinkedContactIds,
  computeNextGrNumber,
  findStudentRegistrationConflict,
} from './studentRegistrationUtils.js';

const settings = {
  grNumberTemplate: '{seq}-{year}',
  grNumberDigits: 4,
  grNumberRestartAnnually: true,
};

describe('computeNextGrNumber', () => {
  it('increments within registration year', () => {
    const gr = computeNextGrNumber(
      [{ registeredDate: '2026-01-01', grNumber: '0001-2026' }],
      settings,
      '2026-03-01',
    );
    expect(gr).toBe('0002-2026');
  });

  it('resets sequence for a new year when restartAnnually', () => {
    const gr = computeNextGrNumber(
      [{ registeredDate: '2025-12-01', grNumber: '0099-2025' }],
      settings,
      '2026-01-15',
    );
    expect(gr).toBe('0001-2026');
  });
});

describe('findStudentRegistrationConflict', () => {
  const roster = [
    { id: 's1', contactId: 10, email: 'a@x.com', name: 'Ali', dob: '2010-01-01' },
  ];

  it('detects contact conflict', () => {
    expect(findStudentRegistrationConflict(roster, { contactId: 10 })).toBe('contact');
  });

  it('skips excluded id', () => {
    expect(findStudentRegistrationConflict(roster, { excludeId: 's1', contactId: 10 })).toBeNull();
  });
});

describe('collectStudentLinkedContactIds', () => {
  it('excludes current student', () => {
    const ids = collectStudentLinkedContactIds(
      [{ id: 's1', contactId: 1 }, { id: 's2', contactId: 2 }],
      's1',
    );
    expect(ids).toEqual([2]);
  });
});
