import { describe, expect, it } from 'vitest';
import {
  collectStudentLinkedContactIds,
  computeNextGrNumber,
  findStudentRegistrationConflict,
  backfillMissingStudentGrNumbers,
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

  it('detects GR number conflict (case-insensitive)', () => {
    const withGr = [{ id: 's1', contactId: 10, grNumber: 'GR-0001' }];
    expect(findStudentRegistrationConflict(withGr, { grNumber: 'gr-0001' })).toBe('grNumber');
    expect(
      findStudentRegistrationConflict(withGr, { excludeId: 's1', grNumber: 'GR-0001' }),
    ).toBeNull();
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

describe('backfillMissingStudentGrNumbers', () => {
  it('fills missing GR using year restart rules', () => {
    const updated = backfillMissingStudentGrNumbers(
      [
        { id: 's1', registeredDate: '2026-01-01', grNumber: '0001-2026' },
        { id: 's2', registeredDate: '2026-02-01' },
      ],
      settings,
      '2026-03-01',
    );
    expect(updated).toHaveLength(1);
    expect(updated[0]?.id).toBe('s2');
    expect(updated[0]?.grNumber).toBe('0002-2026');
  });
});
