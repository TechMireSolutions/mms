import { describe, expect, it } from 'vitest';
import {
  getPeriodBoundaries,
  percentChange,
} from '@/tenant/features/dashboard/hooks/dashboardMetricUtils';

describe('dashboardMetricUtils', () => {
  it('percentChange returns 100 when previous is zero and current is positive', () => {
    expect(percentChange(10, 0)).toBe(100);
  });

  it('percentChange returns 0 when both are zero', () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it('percentChange rounds relative delta', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it('getPeriodBoundaries returns ISO dates with start after end for positive windows', () => {
    const { startTime, endTime } = getPeriodBoundaries(0, 7);
    expect(startTime >= endTime).toBe(true);
    expect(startTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
