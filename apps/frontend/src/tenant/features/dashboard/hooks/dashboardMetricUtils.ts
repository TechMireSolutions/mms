import { formatDateToIso } from '@mms/shared';
import type { Distribution } from '@/lib/data/hasanatData';
import type { Session } from '@/lib/data/sessionsData';
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

/** Sum hasanat points issued between `daysEnd` and `daysStart` days ago (inclusive window). */
export function getHasanatPointsInPeriod(
  distributions: Distribution[],
  pointsMap: Map<string, number>,
  daysStart: number,
  daysEnd: number,
): number {
  let sum = 0;
  const { startTime, endTime } = getPeriodBoundaries(daysStart, daysEnd);

  distributions.forEach((distribution) => {
    if (!distribution.issuedDate) return;
    if (distribution.issuedDate >= endTime && distribution.issuedDate <= startTime) {
      const points = pointsMap.get(distribution.denominationId);
      if (points == null) return;
      sum += (distribution.quantity || 1) * points;
    }
  });
  return sum;
}

export function getSessionsInPeriod(sessions: Session[], daysStart: number, daysEnd: number): number {
  const { startTime, endTime } = getPeriodBoundaries(daysStart, daysEnd);

  return sessions.filter((session) => {
    if (!session.startDate) return false;
    return session.startDate >= endTime && session.startDate <= startTime;
  }).length;
}

/** Percent change helper used by dashboard metric trends. */
export function percentChange(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}
