import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { computeCustomCard as computeCustomCardShared } from '@/lib/reports/reportMetadata';
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

export function buildDashboardMetricCard({
  widget,
  data,
  trends,
  t,
}: BuildDashboardMetricCardArgs): StatItem {
  const {
    studentsTotal,
    teachersTotal,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    denoms,
    contactsTotal,
    questions,
    tests,
    assessmentResults,
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

  const computedCard = computeCustomCardShared(
    {
      id: widget.id,
      role: widget.role,
      title: resolveWidgetTitle(widget, t),
      collection: widget.collection,
      operation: widget.operation || 'count',
      targetField: widget.targetField,
      filterField: widget.filterField,
      filterOperator: widget.filterOperator,
      filterValue: widget.filterValue,
      icon: widget.icon || 'GraduationCap',
      color: widget.color || 'emerald',
      subTextType: widget.subTextType || 'dynamic',
      fixedSubText: resolveWidgetSubText(widget, t) || undefined,
      trend: widget.trend,
      trendType: widget.trendType,
    },
    {
      students: [],
      teachers: [],
      sessions,
      finance_invoices: invoices,
      attendance_records: attendanceRecords,
      hasanat_distributions: hasanatDistributions,
      hasanat_denoms: denoms,
      contacts: [],
      questions,
      tests,
      assessment_results: assessmentResults,
    },
    t,
  );

  let resolvedTrend = computedCard.trend || 0;
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
    id: computedCard.id,
    title: resolveWidgetTitle(widget, t),
    value: computedCard.value,
    sub: computedCard.sub,
    icon: computedCard.icon,
    color: computedCard.color,
    trend: resolvedTrend,
  };
}
