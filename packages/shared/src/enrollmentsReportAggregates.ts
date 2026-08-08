import { z } from 'zod';

/** Cumulative month-end enrollment headcount — `monthKey` is YYYY-MM. */
export const enrollmentsCumulativeTrendSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  students: z.number().int().nonnegative(),
});

export const enrollmentsReportStatusCountsSchema = z.object({
  pending: z.number().int().nonnegative(),
  confirmed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const enrollmentsReportFeesSchema = z.object({
  due: z.number().nonnegative(),
  paid: z.number().nonnegative(),
});

export const enrollmentsReportBySessionItemSchema = z.object({
  sessionId: z.string(),
  name: z.string(),
  count: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const enrollmentsReportComparisonSessionSchema = z.object({
  sessionId: z.string(),
  enrollmentCount: z.number().int().nonnegative(),
  studentIds: z.array(z.string()),
});

export const enrollmentsReportComparisonMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  count: z.number().int().nonnegative(),
});

export const enrollmentsReportComparisonSchema = z.object({
  sessions: z.array(enrollmentsReportComparisonSessionSchema),
  monthly: z.object({
    a: z.array(enrollmentsReportComparisonMonthSchema),
    b: z.array(enrollmentsReportComparisonMonthSchema),
  }),
});

export const enrollmentsReportAggregatesSchema = z.object({
  cumulativeTrends: z.array(enrollmentsCumulativeTrendSchema),
  statusCounts: enrollmentsReportStatusCountsSchema,
  fees: enrollmentsReportFeesSchema,
  bySession: z.array(enrollmentsReportBySessionItemSchema),
  comparison: enrollmentsReportComparisonSchema.optional(),
});

export type EnrollmentsCumulativeTrend = z.infer<typeof enrollmentsCumulativeTrendSchema>;
export type EnrollmentsReportStatusCounts = z.infer<typeof enrollmentsReportStatusCountsSchema>;
export type EnrollmentsReportFees = z.infer<typeof enrollmentsReportFeesSchema>;
export type EnrollmentsReportBySessionItem = z.infer<typeof enrollmentsReportBySessionItemSchema>;
export type EnrollmentsReportComparisonSession = z.infer<typeof enrollmentsReportComparisonSessionSchema>;
export type EnrollmentsReportComparisonMonth = z.infer<typeof enrollmentsReportComparisonMonthSchema>;
export type EnrollmentsReportComparison = z.infer<typeof enrollmentsReportComparisonSchema>;
export type EnrollmentsReportAggregates = z.infer<typeof enrollmentsReportAggregatesSchema>;

/** Optional ComparisonMode params for GET /report-aggregates. */
export type EnrollmentsReportComparisonQuery = {
  sessionIds?: string[];
  rangeAFrom?: string;
  rangeATo?: string;
  rangeBFrom?: string;
  rangeBTo?: string;
};

/** Minimal row shape for pure EnrollmentReports panel compute. */
export type EnrollmentReportPanelRow = {
  sessionId: string;
  sessionName: string;
  status: string;
  paymentStatus: string;
  finalFee: number;
};

export const EMPTY_ENROLLMENTS_REPORT_COMPARISON: EnrollmentsReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_ENROLLMENTS_REPORT_AGGREGATES: EnrollmentsReportAggregates = {
  cumulativeTrends: [],
  statusCounts: { pending: 0, confirmed: 0, cancelled: 0, completed: 0, total: 0 },
  fees: { due: 0, paid: 0 },
  bySession: [],
};

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeEnrollmentsReportComparisonQuery(
  input: EnrollmentsReportComparisonQuery | undefined,
): EnrollmentsReportComparisonQuery | undefined {
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
export function enrollmentsReportComparisonQueryActive(
  query: EnrollmentsReportComparisonQuery | undefined,
): boolean {
  return Boolean(
    (query?.sessionIds && query.sessionIds.length > 0)
    || (query?.rangeAFrom && query.rangeATo)
    || (query?.rangeBFrom && query.rangeBTo),
  );
}

/**
 * Pure cumulative month-end headcount for the last `monthCount` months
 * (EnrollmentChart SSOT — enrolledDate string ≤ YYYY-MM-31).
 */
export function computeEnrollmentsCumulativeTrends(
  enrolledDates: readonly string[],
  monthCount = 12,
  now: Date = new Date(),
): EnrollmentsCumulativeTrend[] {
  const trends: EnrollmentsCumulativeTrend[] = [];
  const validDates = enrolledDates.filter((date) => /^\d{4}/.test(date.trim()));

  for (let offset = monthCount - 1; offset >= 0; offset--) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = cursor.getFullYear();
    const monthNum = String(cursor.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${monthNum}`;
    const cutoff = `${monthKey}-31`;
    const students = validDates.filter((date) => date.trim() <= cutoff).length;
    trends.push({ monthKey, students });
  }

  return trends;
}

/**
 * Pure KPI / chart / by-session panels for EnrollmentReports
 * (mirrors prior FE client reductions over active enrollments).
 */
export function computeEnrollmentsReportPanels(
  enrollments: readonly EnrollmentReportPanelRow[],
): Pick<EnrollmentsReportAggregates, 'statusCounts' | 'fees' | 'bySession'> {
  const statusCounts: EnrollmentsReportStatusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    total: enrollments.length,
  };
  let due = 0;
  let paid = 0;
  const sessionStatsById: Record<string, EnrollmentsReportBySessionItem> = {};

  for (const enrollment of enrollments) {
    const status = String(enrollment.status || '');
    if (status === 'pending') statusCounts.pending += 1;
    else if (status === 'confirmed') statusCounts.confirmed += 1;
    else if (status === 'cancelled') statusCounts.cancelled += 1;
    else if (status === 'completed') statusCounts.completed += 1;

    const fee = Number(enrollment.finalFee) || 0;
    if (status !== 'cancelled') due += fee;
    if (enrollment.paymentStatus === 'paid') paid += fee;

    const sessionId = enrollment.sessionId || '';
    if (!sessionStatsById[sessionId]) {
      sessionStatsById[sessionId] = {
        sessionId,
        name: enrollment.sessionName || '',
        count: 0,
        revenue: 0,
      };
    }
    sessionStatsById[sessionId].count += 1;
    if (status !== 'cancelled') {
      sessionStatsById[sessionId].revenue += fee;
    }
  }

  const bySession = Object.values(sessionStatsById).sort((left, right) => right.count - left.count);

  return {
    statusCounts,
    fees: { due, paid },
    bySession,
  };
}
