import { describe, expect, it } from 'vitest';
import { buildContactsDateRangeComparison } from '@/tenant/features/reports/components/comparisonModeCompute';

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
