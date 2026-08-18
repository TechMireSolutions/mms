import { formatMoney } from '@mms/shared';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
  computeSessionsCustomCardValue,
} from '@/lib/reports/widgetDataUtils';
import {
  resolveWidgetTitle,
  resolveWidgetSubText,
  type StatItem,
} from '@/lib/dashboardWidgets';
import {
  resolveDashboardTrendMetric,
  TREND_METRIC_KEY_MAP,
} from '@/lib/dashboardCollections';
import { resolveCardVisuals } from '@/lib/dashboardWidgetColors';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { DashboardMetricTrends } from '@/tenant/features/dashboard/hooks/dashboardMetricTrends';
import type { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';

type DashboardData = ReturnType<typeof useDashboardData>;

interface BuildDashboardMetricCardArgs {
  widget: CustomWidget;
  data: DashboardData;
  trends: DashboardMetricTrends;
  t: TranslationFunction;
}

const CUSTOM_CARD_EVALUATORS = {
  contacts: { computeFn: computeContactsCustomCardValue, totalKey: 'contactsTotal', trendKey: 'contactTrend' },
  students: { computeFn: computeStudentsCustomCardValue, totalKey: 'studentsTotal', trendKey: 'studentTrend' },
  teachers: { computeFn: computeTeachersCustomCardValue, totalKey: 'teachersTotal', trendKey: 'teacherTrend' },
  sessions: { computeFn: computeSessionsCustomCardValue, totalKey: 'sessionsTotal', trendKey: 'sessionsTrend' },
} as const;

function tryCustomCollectionCardValue(
  widget: CustomWidget,
  computeFn: (args: {
    id: string;
    operation: NonNullable<CustomWidget['operation']>;
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget['filterOperator'];
    filterValue?: string;
  }) => { finalValue: string | number } | null,
  totalCount: number,
  t: TranslationFunction,
): { value: string; sub: string } | null {
  const aggregateValue = computeFn({
    id: widget.id,
    operation: widget.operation || 'count',
    targetField: widget.targetField,
    filterField: widget.filterField,
    filterOperator: widget.filterOperator,
    filterValue: widget.filterValue,
  });
  if (!aggregateValue) return null;

  return {
    value: String(aggregateValue.finalValue),
    sub: resolveWidgetSubText(widget, t) || t('reports.widgets.totalCountText', { count: totalCount }),
  };
}

type CollectionMetricResolver = (
  widget: CustomWidget,
  data: DashboardData,
) => { value: string; sub?: string } | null;

function resolveQuestionBankMetric(
  widget: CustomWidget,
  data: DashboardData,
): { value: string } {
  const { questionBankMetrics } = data;
  if (widget.collection === 'tests') return { value: String(questionBankMetrics?.totalTests ?? 0) };
  if (widget.collection === 'assessment_results') return { value: String(questionBankMetrics?.totalResults ?? 0) };
  return { value: String(questionBankMetrics?.total ?? 0) };
}

const COLLECTION_METRIC_RESOLVERS: Record<string, CollectionMetricResolver> = {
  contacts: (_widget, data) => ({ value: String(data.contactsTotal) }),
  students: (widget, data) => {
    if (widget.filterValue === 'active') {
      return { value: String(data.studentMetricsActive) };
    }
    return { value: String(data.studentsTotal) };
  },
  teachers: (_widget, data) => ({ value: String(data.teachersTotal) }),
  sessions: (widget, data) => {
    const { sessionsMetrics } = data;
    if (widget.filterValue === 'active' || widget.id.includes('sessions')) {
      return { value: String(sessionsMetrics?.active ?? 0), sub: undefined };
    }
    if (widget.id.includes('classes')) {
      return { value: String(sessionsMetrics?.totalClasses ?? 0) };
    }
    return { value: String(sessionsMetrics?.total ?? 0) };
  },
  attendance_records: (widget, data) => {
    const { attendanceMetrics } = data;
    const rate =
      attendanceMetrics?.overallPresentRate ??
      attendanceMetrics?.selectedDatePresentRate ??
      0;
    if (widget.operation === 'percentage') {
      return { value: `${rate}%` };
    }
    return { value: String(attendanceMetrics?.total ?? 0) };
  },
  finance_invoices: (widget, data) => {
    const { financeMetrics, accountingMetrics } = data;
    if (widget.id.includes('revenue') || widget.id.includes('expenses')) {
      if (widget.id.includes('revenue')) {
        return { value: formatMoney(accountingMetrics?.revenue ?? 0) };
      }
      return { value: formatMoney(accountingMetrics?.expenses ?? 0) };
    }
    if (widget.targetField === 'paidAmt' || widget.filterValue === 'paid') {
      return { value: formatMoney(financeMetrics?.collectedTotal ?? 0) };
    }
    if (
      widget.targetField === 'finalAmt' &&
      (widget.filterValue === 'unpaid' || widget.id.includes('outstanding'))
    ) {
      return { value: formatMoney(financeMetrics?.outstandingBalance ?? 0) };
    }
    if (widget.targetField === 'discountAmt') {
      return { value: formatMoney(financeMetrics?.discountTotal ?? 0) };
    }
    if (widget.operation === 'percentage' && widget.filterValue === 'paid') {
      const total = financeMetrics?.totalInvoices ?? 0;
      const paid = financeMetrics?.paid ?? 0;
      return { value: `${total > 0 ? Math.round((paid / total) * 100) : 0}%` };
    }
    if (widget.operation === 'count') {
      return { value: String(financeMetrics?.totalInvoices ?? 0) };
    }
    return { value: formatMoney(financeMetrics?.collectedTotal ?? 0) };
  },
  hasanat_distributions: (_widget, data) => ({
    value: String(data.hasanatMetrics?.totalPointsDistributed ?? 0),
  }),
  questions: resolveQuestionBankMetric,
  tests: resolveQuestionBankMetric,
  assessment_results: resolveQuestionBankMetric,
};

function resolveServerMetricValue(
  widget: CustomWidget,
  data: DashboardData,
): { value: string; sub?: string } | null {
  const resolver = COLLECTION_METRIC_RESOLVERS[widget.collection];
  return resolver ? resolver(widget, data) : null;
}

export function buildDashboardMetricCard({
  widget,
  data,
  trends,
  t,
}: BuildDashboardMetricCardArgs): StatItem {
  let resolvedMetric: { value: string; sub?: string } | null = null;
  let customTrend: number | undefined;

  const customEvaluator = CUSTOM_CARD_EVALUATORS[widget.collection as keyof typeof CUSTOM_CARD_EVALUATORS];
  if (customEvaluator) {
    resolvedMetric = tryCustomCollectionCardValue(
      widget,
      customEvaluator.computeFn,
      data[customEvaluator.totalKey],
      t,
    );
    if (resolvedMetric) {
      customTrend = trends[customEvaluator.trendKey];
    }
  }

  if (!resolvedMetric) {
    resolvedMetric = resolveServerMetricValue(widget, data);
  }

  const value = resolvedMetric?.value ?? '0';
  const sub = resolvedMetric?.sub ?? resolveWidgetSubText(widget, t);

  const trendMetric = resolveDashboardTrendMetric(widget.id);
  const trendKey = trendMetric ? TREND_METRIC_KEY_MAP[trendMetric] : undefined;
  const resolvedTrend =
    customTrend ??
    (trendKey && typeof trends[trendKey] === 'number'
      ? trends[trendKey]
      : widget.trendType === 'database'
        ? 0
        : typeof widget.trend === 'number'
          ? widget.trend
          : 0);

  const { icon, color } = resolveCardVisuals(widget);

  return {
    id: widget.id,
    title: resolveWidgetTitle(widget, t),
    value,
    sub,
    icon,
    color,
    trend: resolvedTrend,
  };
}
