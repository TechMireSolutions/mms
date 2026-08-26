import { z } from 'zod';

export const examinationsReportComparisonSessionSchema = z.object({
  sessionId: z.string(),
  passRatePct: z.number().nonnegative().max(100),
});

export const examinationsReportComparisonMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  passCount: z.number().nonnegative(),
  totalCount: z.number().nonnegative(),
});

export const examinationsReportComparisonSchema = z.object({
  sessions: z.array(examinationsReportComparisonSessionSchema),
  monthly: z.object({
    a: z.array(examinationsReportComparisonMonthSchema),
    b: z.array(examinationsReportComparisonMonthSchema),
  }),
});

/** ComparisonMode examinations aggregates (optional comparison slice). */
export const examinationsReportAggregatesSchema = z.object({
  comparison: examinationsReportComparisonSchema.optional(),
});

export type ExaminationsReportComparisonSession = z.infer<typeof examinationsReportComparisonSessionSchema>;
export type ExaminationsReportComparisonMonth = z.infer<typeof examinationsReportComparisonMonthSchema>;
export type ExaminationsReportComparison = z.infer<typeof examinationsReportComparisonSchema>;
export type ExaminationsReportAggregates = z.infer<typeof examinationsReportAggregatesSchema>;

/** Optional ComparisonMode params for GET /examinations/report-aggregates. */
export type ExaminationsReportComparisonQuery = {
  sessionIds?: string[];
  rangeAFrom?: string;
  rangeATo?: string;
  rangeBFrom?: string;
  rangeBTo?: string;
};

export const EMPTY_EXAMINATIONS_REPORT_COMPARISON: ExaminationsReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_EXAMINATIONS_REPORT_AGGREGATES: ExaminationsReportAggregates = {};

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeExaminationsReportComparisonQuery(
  input: ExaminationsReportComparisonQuery | undefined,
): ExaminationsReportComparisonQuery | undefined {
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
export function examinationsReportComparisonQueryActive(
  query: ExaminationsReportComparisonQuery | undefined,
): boolean {
  return Boolean(
    (query?.sessionIds && query.sessionIds.length > 0)
    || (query?.rangeAFrom && query.rangeATo)
    || (query?.rangeBFrom && query.rangeBTo),
  );
}
