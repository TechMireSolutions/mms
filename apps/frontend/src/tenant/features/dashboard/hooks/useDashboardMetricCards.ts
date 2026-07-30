import { useMemo } from 'react';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { widgetMatchesDashboardRole, type DashboardRole } from '@/lib/dashboardRole';
import {
  isDashboardWidgetModuleEnabled,
} from '@/lib/dashboardCollections';
import type { StatItem } from '@/tenant/features/dashboard/components/StatisticsGrid';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';
import { computeDashboardMetricTrends } from '@/tenant/features/dashboard/hooks/dashboardMetricTrends';
import { buildDashboardMetricCard } from '@/tenant/features/dashboard/hooks/buildDashboardMetricCard';

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
    const trends = computeDashboardMetricTrends({
      studentsTotal,
      studentMetricsNew,
      teachersTotal,
      teacherMetricsNew,
      contactsTotal,
      contactMetricsNew,
      attendanceRecords,
      invoices,
      hasanatDistributions,
      denoms,
      sessions,
    });

    const dashboardCardWidgets = customWidgets.filter(
      (widget) => widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole),
    );

    const enabledDashboardCardWidgets = dashboardCardWidgets.filter((widget) =>
      isDashboardWidgetModuleEnabled(widget, enabledModules),
    );

    return enabledDashboardCardWidgets.map((widget) => buildDashboardMetricCard({ widget, data, trends, t }));
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
    data,
    t,
  ]);
}
