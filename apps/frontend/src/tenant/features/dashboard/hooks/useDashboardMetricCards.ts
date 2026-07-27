import { useMemo } from 'react';
import {
  getCollectedAmountForMonth,
  getOutstandingAmountForMonth,
} from '@mms/shared';
import type { CustomWidget } from '@/tenant/features/reports/components/PinnedWidgets';
import { computeCustomCard as computeCustomCardShared } from '@/tenant/features/reports/components/reportMetadata';
import {
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from '@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils';
import { resolveWidgetTitle, resolveWidgetSubText } from '@/lib/dashboardWidgets';
import { widgetMatchesDashboardRole, type DashboardRole } from '@/lib/dashboardRole';
import {
  isDashboardWidgetModuleEnabled,
  resolveDashboardTrendMetric,
} from '@/lib/dashboardCollections';
import type { StatItem } from '@/tenant/features/dashboard/components/StatisticsGrid';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import {
  getAttendanceRateForDate,
  getHasanatPointsInPeriod,
  getSessionsInPeriod,
  percentChange,
} from '@/tenant/features/dashboard/hooks/dashboardMetricUtils';
import type { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';

type DashboardData = ReturnType<typeof useDashboardData>;

interface UseDashboardMetricCardsArgs {
  customWidgets: CustomWidget[];
  dashboardRole: DashboardRole;
  enabledModules: Record<string, boolean | undefined>;
  data: DashboardData;
  t: TranslationFunction;
}

/**
 * Builds role-scoped, module-filtered dashboard KPI cards with live trends.
 */
export function useDashboardMetricCards({
  customWidgets,
  dashboardRole,
  enabledModules,
  data,
  t,
}: UseDashboardMetricCardsArgs): StatItem[] {
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
    studentMetricsNew,
    teacherMetricsNew,
    contactMetricsNew,
  } = data;

  return useMemo(() => {
    const studentTrend = studentsTotal && studentMetricsNew
      ? Math.round((studentMetricsNew / Math.max(1, studentsTotal - studentMetricsNew)) * 100)
      : 0;
    const teacherTrend = teachersTotal && teacherMetricsNew
      ? Math.round((teacherMetricsNew / Math.max(1, teachersTotal - teacherMetricsNew)) * 100)
      : 0;
    const contactTrend = contactsTotal && contactMetricsNew
      ? Math.round((contactMetricsNew / Math.max(1, contactsTotal - contactMetricsNew)) * 100)
      : 0;

    const sortedDates = [...new Set(attendanceRecords.map((record) => record.date as string))].sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    const prevDate = sortedDates[sortedDates.length - 2];
    const latestRate = latestDate ? getAttendanceRateForDate(attendanceRecords, latestDate) : null;
    const prevRate = prevDate ? getAttendanceRateForDate(attendanceRecords, prevDate) : null;
    const attendanceTrend = (latestRate !== null && prevRate !== null && prevRate > 0)
      ? Math.round(latestRate - prevRate)
      : 0;

    const now = new Date();
    const currentMonthCollected = getCollectedAmountForMonth(invoices, now.getFullYear(), now.getMonth());
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthCollected = getCollectedAmountForMonth(
      invoices,
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
    );
    const feesTrend = percentChange(currentMonthCollected, prevMonthCollected);

    const currentOutstanding = getOutstandingAmountForMonth(invoices, now.getFullYear(), now.getMonth());
    const prevOutstanding = getOutstandingAmountForMonth(
      invoices,
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
    );
    const outstandingTrend = percentChange(currentOutstanding, prevOutstanding);

    const pointsMap = new Map<string, number>();
    (denoms || []).forEach((denom) => pointsMap.set(denom.id, denom.points));
    const pointsThisWeek = getHasanatPointsInPeriod(hasanatDistributions, pointsMap, 0, 7);
    const pointsLastWeek = getHasanatPointsInPeriod(hasanatDistributions, pointsMap, 7, 14);
    const hasanatTrend = percentChange(pointsThisWeek, pointsLastWeek);

    const sessionsThisWeek = getSessionsInPeriod(sessions, 0, 7);
    const sessionsLastWeek = getSessionsInPeriod(sessions, 7, 14);
    const sessionsTrend = percentChange(sessionsThisWeek, sessionsLastWeek);

    const dashboardCardWidgets = customWidgets.filter(
      (widget) => widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole),
    );

    const enabledDashboardCardWidgets = dashboardCardWidgets.filter((widget) =>
      isDashboardWidgetModuleEnabled(widget, enabledModules),
    );

    return enabledDashboardCardWidgets.map((widget): StatItem => {
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
    });
  }, [
    dashboardRole,
    enabledModules,
    customWidgets,
    studentsTotal,
    studentMetricsNew,
    teachersTotal,
    teacherMetricsNew,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    denoms,
    contactsTotal,
    contactMetricsNew,
    questions,
    tests,
    assessmentResults,
    t,
  ]);
}
