import { describe, expect, it } from 'vitest';
import {
  getPeriodBoundaries,
  percentChange,
  getAttendanceRateForDate,
} from '@/tenant/features/dashboard/hooks/dashboardMetricUtils';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

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

  it('getAttendanceRateForDate counts present and late', () => {
    const records = [
      { date: '2026-07-01', status: 'present' },
      { date: '2026-07-01', status: 'late' },
      { date: '2026-07-01', status: 'absent' },
      { date: '2026-07-02', status: 'present' },
    ] as AttendanceRecord[];
    expect(getAttendanceRateForDate(records, '2026-07-01')).toBeCloseTo(66.666, 1);
    expect(getAttendanceRateForDate(records, '2026-07-03')).toBeNull();
  });
});
