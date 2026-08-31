import { z } from 'zod';

export const attendanceReportComparisonSessionSchema = z.object({
  sessionId: z.string(),
  attendancePct: z.number().int().min(0).max(100),
});

export const attendanceReportComparisonMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  presentCount: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const attendanceReportComparisonSchema = z.object({
  sessions: z.array(attendanceReportComparisonSessionSchema),
  monthly: z.object({
    a: z.array(attendanceReportComparisonMonthSchema),
    b: z.array(attendanceReportComparisonMonthSchema),
  }),
});

/** ComparisonMode attendance aggregates (optional comparison slice). */
export const attendanceReportAggregatesSchema = z.object({
  comparison: attendanceReportComparisonSchema.optional(),
});

export type AttendanceReportComparisonSession = z.infer<typeof attendanceReportComparisonSessionSchema>;
export type AttendanceReportComparisonMonth = z.infer<typeof attendanceReportComparisonMonthSchema>;
export type AttendanceReportComparison = z.infer<typeof attendanceReportComparisonSchema>;
export type AttendanceReportAggregates = z.infer<typeof attendanceReportAggregatesSchema>;

import {
  type BaseReportComparisonQuery,
  normalizeReportComparisonQuery,
  reportComparisonQueryActive,
} from './reportComparisonQuery.js';

/** Optional ComparisonMode params for GET /attendance/report-aggregates. */
export type AttendanceReportComparisonQuery = BaseReportComparisonQuery;

export const EMPTY_ATTENDANCE_REPORT_COMPARISON: AttendanceReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_ATTENDANCE_REPORT_AGGREGATES: AttendanceReportAggregates = {};

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeAttendanceReportComparisonQuery(
  input: AttendanceReportComparisonQuery | undefined,
): AttendanceReportComparisonQuery | undefined {
  return normalizeReportComparisonQuery(input);
}

/** True when any comparison SQL slice should run. */
export function attendanceReportComparisonQueryActive(
  query: AttendanceReportComparisonQuery | undefined,
): boolean {
  return reportComparisonQueryActive(query);
}
