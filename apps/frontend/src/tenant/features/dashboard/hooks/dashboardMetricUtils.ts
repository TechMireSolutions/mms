import { formatDateToIso } from '@mms/shared';

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
