import { formatMoney } from '@mms/shared';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from '@/lib/reports/widgetDataUtils';
import { resolveWidgetTitle, resolveWidgetSubText } from '@/lib/dashboardWidgets';
import { resolveDashboardTrendMetric } from '@/lib/dashboardCollections';
import type { StatItem } from '@/tenant/features/dashboard/components/StatisticsGrid';
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

function resolveServerMetricValue(
  widget: CustomWidget,
  data: DashboardData,
): { value: string; sub?: string } | null {
  const {
    sessionsMetrics,
    attendanceMetrics,
    financeMetrics,
    hasanatMetrics,
    accountingMetrics,
    questionBankMetrics,
  } = data;

  if (widget.collection === 'sessions') {
    if (widget.filterValue === 'active' || widget.id.includes('sessions')) {
      return {
        value: String(sessionsMetrics?.active ?? 0),
        sub: undefined,
      };
    }
    if (widget.id.includes('classes')) {
      return {
        value: String(sessionsMetrics?.totalClasses ?? 0),
      };
    }
    return { value: String(sessionsMetrics?.total ?? 0) };
  }

  if (widget.collection === 'attendance_records') {
    const rate = attendanceMetrics?.overallPresentRate
      ?? attendanceMetrics?.selectedDatePresentRate
      ?? 0;
    if (widget.operation === 'percentage') {
      return { value: `${rate}%` };
    }
    return { value: String(attendanceMetrics?.total ?? 0) };
  }

  if (widget.collection === 'finance_invoices') {
    if (widget.id.includes('revenue') || widget.id.includes('expenses')) {
      if (widget.id.includes('revenue')) {
        return { value: formatMoney(accountingMetrics?.revenue ?? 0) };
      }
      return { value: formatMoney(accountingMetrics?.expenses ?? 0) };
    }
    if (widget.targetField === 'paidAmt' || widget.filterValue === 'paid') {
      return { value: formatMoney(financeMetrics?.collectedTotal ?? 0) };
    }
    if (widget.targetField === 'finalAmt' && (widget.filterValue === 'unpaid' || widget.id.includes('outstanding'))) {
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
  }

  if (widget.collection === 'hasanat_distributions') {
    return { value: String(hasanatMetrics?.totalPointsDistributed ?? 0) };
  }

  if (widget.collection === 'questions' || widget.collection === 'tests' || widget.collection === 'assessment_results') {
    if (widget.collection === 'tests') return { value: String(questionBankMetrics?.totalTests ?? 0) };
    if (widget.collection === 'assessment_results') return { value: String(questionBankMetrics?.totalResults ?? 0) };
    return { value: String(questionBankMetrics?.total ?? 0) };
  }

  return null;
}

export function buildDashboardMetricCard({
  widget,
  data,
  trends,
  t,
}: BuildDashboardMetricCardArgs): StatItem {
  const {
    studentsTotal,
    teachersTotal,
    contactsTotal,
  } = data;

  const {
    studentTrend,
    teacherTrend,
    contactTrend,
    attendanceTrend,
    feesTrend,
    outstandingTrend,
    hasanatTrend,
    sessionsTrend,
  } = trends;

  if (widget.collection === 'contacts') {
    const aggregateValue = computeContactsCustomCardValue({
      id: widget.id,
      operation: widget.operation || 'count',
      targetField: widget.targetField,
      filterField: widget.filterField,
      filterOperator: widget.filterOperator,
      filterValue: widget.filterValue,
    });
    if (aggregateValue) {
      return {
        id: widget.id,
        title: resolveWidgetTitle(widget, t),
        value: String(aggregateValue.finalValue),
        sub: resolveWidgetSubText(widget, t) || t('reports.widgets.totalCountText', { count: contactsTotal }),
        icon: widget.icon || 'Users',
        color: widget.color || 'blue',
        trend: contactTrend,
      };
    }
  }

  if (widget.collection === 'students') {
    const aggregateValue = computeStudentsCustomCardValue({
      id: widget.id,
      operation: widget.operation || 'count',
      targetField: widget.targetField,
      filterField: widget.filterField,
      filterOperator: widget.filterOperator,
      filterValue: widget.filterValue,
    });
    if (aggregateValue) {
      return {
        id: widget.id,
        title: resolveWidgetTitle(widget, t),
        value: String(aggregateValue.finalValue),
        sub: resolveWidgetSubText(widget, t) || t('reports.widgets.totalCountText', { count: studentsTotal }),
        icon: widget.icon || 'GraduationCap',
        color: widget.color || 'emerald',
        trend: studentTrend,
      };
    }
  }

  if (widget.collection === 'teachers') {
    const aggregateValue = computeTeachersCustomCardValue({
      id: widget.id,
      operation: widget.operation || 'count',
      targetField: widget.targetField,
      filterField: widget.filterField,
      filterOperator: widget.filterOperator,
      filterValue: widget.filterValue,
    });
    if (aggregateValue) {
      return {
        id: widget.id,
        title: resolveWidgetTitle(widget, t),
        value: String(aggregateValue.finalValue),
        sub: resolveWidgetSubText(widget, t) || t('reports.widgets.totalCountText', { count: teachersTotal }),
        icon: widget.icon || 'School',
        color: widget.color || 'blue',
        trend: teacherTrend,
      };
    }
  }

  const serverValue = resolveServerMetricValue(widget, data);
  const value = serverValue?.value ?? '0';
  const sub = resolveWidgetSubText(widget, t) || serverValue?.sub || '';

  let resolvedTrend = typeof widget.trend === 'number' ? widget.trend : 0;
  const trendMetric = resolveDashboardTrendMetric(widget.id);
  if (trendMetric === 'attendance') resolvedTrend = attendanceTrend;
  else if (trendMetric === 'fees') resolvedTrend = feesTrend;
  else if (trendMetric === 'outstanding') resolvedTrend = outstandingTrend;
  else if (trendMetric === 'hasanat') resolvedTrend = hasanatTrend;
  else if (trendMetric === 'sessions') resolvedTrend = sessionsTrend;
  else if (trendMetric === 'contacts') resolvedTrend = contactTrend;
  else if (trendMetric === 'students') resolvedTrend = studentTrend;
  else if (trendMetric === 'teachers') resolvedTrend = teacherTrend;

  return {
    id: widget.id,
    title: resolveWidgetTitle(widget, t),
    value,
    sub,
    icon: widget.icon || 'GraduationCap',
    color: widget.color || 'emerald',
    trend: resolvedTrend,
  };
}
