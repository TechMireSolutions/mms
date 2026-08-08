import { z } from 'zod';

export const hasanatReportComparisonSessionSchema = z.object({
  sessionId: z.string(),
  hasanat: z.number().nonnegative(),
});

export const hasanatReportComparisonMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  points: z.number().nonnegative(),
});

export const hasanatReportComparisonSchema = z.object({
  sessions: z.array(hasanatReportComparisonSessionSchema),
  monthly: z.object({
    a: z.array(hasanatReportComparisonMonthSchema),
    b: z.array(hasanatReportComparisonMonthSchema),
  }),
});

/** ComparisonMode hasanat aggregates (optional comparison slice). */
export const hasanatReportAggregatesSchema = z.object({
  comparison: hasanatReportComparisonSchema.optional(),
});

export type HasanatReportComparisonSession = z.infer<typeof hasanatReportComparisonSessionSchema>;
export type HasanatReportComparisonMonth = z.infer<typeof hasanatReportComparisonMonthSchema>;
export type HasanatReportComparison = z.infer<typeof hasanatReportComparisonSchema>;
export type HasanatReportAggregates = z.infer<typeof hasanatReportAggregatesSchema>;

/** Optional ComparisonMode params for GET /hasanat/report-aggregates. */
export type HasanatReportComparisonQuery = {
  sessionIds?: string[];
  rangeAFrom?: string;
  rangeATo?: string;
  rangeBFrom?: string;
  rangeBTo?: string;
};

export const EMPTY_HASANAT_REPORT_COMPARISON: HasanatReportComparison = {
  sessions: [],
  monthly: { a: [], b: [] },
};

export const EMPTY_HASANAT_REPORT_AGGREGATES: HasanatReportAggregates = {};

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize ComparisonMode query params (max 2 sessionIds; ISO date ranges).
 */
export function normalizeHasanatReportComparisonQuery(
  input: HasanatReportComparisonQuery | undefined,
): HasanatReportComparisonQuery | undefined {
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
export function hasanatReportComparisonQueryActive(
  query: HasanatReportComparisonQuery | undefined,
): boolean {
  return Boolean(
    (query?.sessionIds && query.sessionIds.length > 0)
    || (query?.rangeAFrom && query.rangeATo)
    || (query?.rangeBFrom && query.rangeBTo),
  );
}
