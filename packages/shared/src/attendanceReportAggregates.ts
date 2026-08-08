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

/** Optional ComparisonMode params for GET /attendance/report-aggregates. */
export type AttendanceReportComparisonQuery = {
  sessionIds?: string[];
  rangeAFrom?: string;
  rangeATo?: string;
  rangeBFrom?: string;
  rangeBTo?: string;
};

export const EMPTY_ATTENDANCE_REPORT_COMPARISON: AttendanceReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_ATTENDANCE_REPORT_AGGREGATES: AttendanceReportAggregates = {};

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeAttendanceReportComparisonQuery(
  input: AttendanceReportComparisonQuery | undefined,
): AttendanceReportComparisonQuery | undefined {
  if (!input) return undefined;
  const sessionIds = (input.sessionIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean)
    .slice(0, 2);
  const rangeAFrom = input.rangeAFrom?.trim();
  const rangeATo = input.rangeATo?.trim();
  const rangeBFrom = input.rangeBFrom?.trim();
  const rangeBTo = input.rangeBTo?.trim();

  const hasSessions = sessionIds.length > 0;
  const hasRangeA = Boolean(rangeAFrom && rangeATo && DATE_PARAM_RE.test(rangeAFrom) && DATE_PARAM_RE.test(rangeATo));
  const hasRangeB = Boolean(rangeBFrom && rangeBTo && DATE_PARAM_RE.test(rangeBFrom) && DATE_PARAM_RE.test(rangeBTo));

  if (!hasSessions && !hasRangeA && !hasRangeB) return undefined;

  return {
    ...(hasSessions ? { sessionIds } : {}),
    ...(hasRangeA ? { rangeAFrom, rangeATo } : {}),
    ...(hasRangeB ? { rangeBFrom, rangeBTo } : {}),
  };
}

/** True when any comparison SQL slice should run. */
export function attendanceReportComparisonQueryActive(
  query: AttendanceReportComparisonQuery | undefined,
): boolean {
  return Boolean(
    (query?.sessionIds && query.sessionIds.length > 0)
    || (query?.rangeAFrom && query.rangeATo)
    || (query?.rangeBFrom && query.rangeBTo),
  );
}
