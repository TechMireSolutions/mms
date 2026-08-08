import { z } from 'zod';

export const financeReportComparisonSessionSchema = z.object({
  sessionId: z.string(),
  feeCollected: z.number().nonnegative(),
});

export const financeReportComparisonMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  collected: z.number().nonnegative(),
});

export const financeReportComparisonSchema = z.object({
  sessions: z.array(financeReportComparisonSessionSchema),
  monthly: z.object({
    a: z.array(financeReportComparisonMonthSchema),
    b: z.array(financeReportComparisonMonthSchema),
  }),
});

/** ComparisonMode finance aggregates (optional comparison slice). */
export const financeReportAggregatesSchema = z.object({
  comparison: financeReportComparisonSchema.optional(),
});

export type FinanceReportComparisonSession = z.infer<typeof financeReportComparisonSessionSchema>;
export type FinanceReportComparisonMonth = z.infer<typeof financeReportComparisonMonthSchema>;
export type FinanceReportComparison = z.infer<typeof financeReportComparisonSchema>;
export type FinanceReportAggregates = z.infer<typeof financeReportAggregatesSchema>;

/** Optional ComparisonMode params for GET /finance/report-aggregates. */
export type FinanceReportComparisonQuery = {
  sessionIds?: string[];
  rangeAFrom?: string;
  rangeATo?: string;
  rangeBFrom?: string;
  rangeBTo?: string;
};

export const EMPTY_FINANCE_REPORT_COMPARISON: FinanceReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_FINANCE_REPORT_AGGREGATES: FinanceReportAggregates = {};

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeFinanceReportComparisonQuery(
  input: FinanceReportComparisonQuery | undefined,
): FinanceReportComparisonQuery | undefined {
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
export function financeReportComparisonQueryActive(
  query: FinanceReportComparisonQuery | undefined,
): boolean {
  return Boolean(
    (query?.sessionIds && query.sessionIds.length > 0)
    || (query?.rangeAFrom && query.rangeATo)
    || (query?.rangeBFrom && query.rangeBTo),
  );
}
