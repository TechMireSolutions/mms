import { formatDateToIso } from '@mms/shared';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

/** Present/late rate for a calendar day, or null when no records. */
export function getAttendanceRateForDate(records: AttendanceRecord[], dateStr: string): number | null {
  const dayRecords = records.filter((record) => record.date === dateStr);
  if (dayRecords.length === 0) return null;
  const present = dayRecords.filter(
    (record) => record.status === 'present' || record.status === 'late',
  ).length;
  return (present / dayRecords.length) * 100;
}

export function getPeriodBoundaries(daysStart: number, daysEnd: number): {
  startTime: string;
  endTime: string;
} {
  const startD = new Date();
  startD.setDate(startD.getDate() - daysStart);
  const startTime = formatDateToIso(startD);

  const endD = new Date();
  endD.setDate(endD.getDate() - daysEnd);
  const endTime = formatDateToIso(endD);

  return { startTime, endTime };
}

/** Percent change helper used by dashboard metric trends. */
export function percentChange(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}
