import { describe, expect, it } from 'vitest';
import {
  buildContactsDateRangeComparison,
  computeDynamicDateRangeComparison,
  computeDynamicSessionComparison,
} from '@/tenant/features/reports/components/comparisonModeCompute';
import type { AppTranslationKey } from '@mms/shared';

const t = (key: AppTranslationKey) => key;

describe('buildContactsDateRangeComparison', () => {
  it('aligns monthly counts for two years by index', () => {
    const result = buildContactsDateRangeComparison(
      [
        {
          year: 2025,
          months: [
            { month: 'Jan', count: 3 },
            { month: 'Feb', count: 5 },
          ],
        },
        {
          year: 2026,
          months: [
            { month: 'Jan', count: 7 },
            { month: 'Feb', count: 1 },
          ],
        },
      ],
      { from: '2025-01-01', to: '2025-12-31' },
      { from: '2026-01-01', to: '2026-12-31' },
    );

    expect(result).toEqual([
      { month: 'Jan', a: 3, b: 7 },
      { month: 'Feb', a: 5, b: 1 },
    ]);
  });

  it('defaults missing B-year buckets to zero', () => {
    const result = buildContactsDateRangeComparison(
      [
        {
          year: 2025,
          months: [{ month: 'Jan', count: 2 }],
        },
      ],
      { from: '2025-01-01', to: '2025-01-31' },
      { from: '2026-01-01', to: '2026-01-31' },
    );

    expect(result).toEqual([{ month: 'Jan', a: 2, b: 0 }]);
  });
});

describe('computeDynamicSessionComparison (enrollment aggregates)', () => {
  it('uses comparison session counts and studentIds for enrollment/hasanat', () => {
    const result = computeDynamicSessionComparison(
      [
        { id: 's1', name: 'Spring', classes: [] },
        { id: 's2', name: 'Fall', classes: [] },
      ] as never,
      [
        { sessionId: 's1', enrollmentCount: 4, studentIds: ['st1', 'st2'] },
        { sessionId: 's2', enrollmentCount: 1, studentIds: ['st3'] },
      ],
      [],
      [],
      [
        {
          recipientStudentId: 'st1',
          quantity: 2,
          denominationId: 'd1',
          denominationName: 'Point',
        },
      ] as never,
      [],
      [],
      [{ id: 'd1', name: 'Point', points: 10 }] as never,
      's1',
      's2',
      t,
    );

    const enrollmentRow = result.find((row) => row.metricKey === 'enrollment');
    const hasanatRow = result.find((row) => row.metricKey === 'hasanat');
    expect(enrollmentRow).toMatchObject({ a: 4, b: 1 });
    expect(hasanatRow).toMatchObject({ a: 20, b: 0 });
  });
});

describe('computeDynamicDateRangeComparison (enrollment monthly)', () => {
  it('maps monthly a/b buckets into month-index series', () => {
    const result = computeDynamicDateRangeComparison(
      'enrollments',
      {
        a: [{ monthKey: '2025-01', count: 3 }, { monthKey: '2025-02', count: 5 }],
        b: [{ monthKey: '2026-01', count: 7 }, { monthKey: '2026-02', count: 1 }],
      },
      [],
      [],
      [],
      [],
      [],
      [],
      { from: '2025-01-01', to: '2025-03-31' },
      { from: '2026-01-01', to: '2026-03-31' },
    );

    expect(result).toEqual([
      { month: 'Jan', a: 3, b: 7 },
      { month: 'Feb', a: 5, b: 1 },
    ]);
  });
});
