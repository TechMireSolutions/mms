import { useMemo, useState } from "react";
import { CalendarCheck, Users, TrendingUp, BarChart2 } from "lucide-react";
import {
  useSessionsMetrics,
  useSessionsReportAggregates,
} from "@/tenant/hooks/collections/sessions";
import { formatMonthName } from "@mms/shared";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { SessionReportCharts } from "./SessionReportCharts";
import { SessionReportDashboardWidgets } from "./SessionReportDashboardWidgets";
import { SessionReportFilterBanner } from "./SessionReportFilterBanner";
import { SessionReportTable } from "./SessionReportTable";

import type {
  CapacityBarDatum,
  EnrollmentTrendItem,
  SessionCapacityItem,
  SessionReportProps,
} from "./sessionReportTypes";

export type {
  EnrollmentTrendItem,
  SessionCapacityItem,
  SessionReportFilters,
  SessionReportProps,
} from "./sessionReportTypes";

/**
 * Renders session utilisation and capacity reports with stacked bar and
 * enrollment trend charts, plus a filterable session capacity table.
 */
export default function SessionReport({ filters }: SessionReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessionStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      active: { label: t("sessions.status.active"), cls: SEMANTIC_BADGE.success },
      upcoming: { label: t("sessions.status.upcoming"), cls: SEMANTIC_BADGE.info },
      completed: { label: t("sessions.status.completed"), cls: SEMANTIC_BADGE.muted },
      cancelled: { label: t("sessions.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
    }),
    [t],
  );
  const { data: sessionsMetrics } = useSessionsMetrics();
  const {
    data: reportAggregates,
    isError,
    refetch,
  } = useSessionsReportAggregates();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const sessionCapacity = reportAggregates?.capacity ?? [];
  const todaysSessions = reportAggregates?.todaysSessions ?? [];

  const enrollmentTrends = useMemo<EnrollmentTrendItem[]>(() => {
    const trends = reportAggregates?.enrollmentTrends ?? [];
    if (trends.length === 0) {
      return [{ month: formatMonthName(new Date()), students: 0, sessionName: null }];
    }
    return trends.map((trend) => ({
      month: formatMonthName(`${trend.monthKey}-01`),
      students: trend.students,
      sessionName: trend.sessionName,
    }));
  }, [reportAggregates?.enrollmentTrends]);

  const sessionCapacityData = useMemo<SessionCapacityItem[]>(() => {
    let filteredSessionCapacity = sessionCapacity;
    if (filters.session !== "all") {
      filteredSessionCapacity = filteredSessionCapacity.filter(
        (capacityItem) => capacityItem.sessionId === filters.session,
      );
    }
    if (selectedSession) {
      filteredSessionCapacity = filteredSessionCapacity.filter(
        (capacityItem) => capacityItem.session === selectedSession,
      );
    }
    if (selectedClass) {
      filteredSessionCapacity = filteredSessionCapacity.filter(
        (capacityItem) => capacityItem.class === selectedClass,
      );
    }
    return filteredSessionCapacity;
  }, [filters.session, sessionCapacity, selectedSession, selectedClass]);

  const filtersAreGlobal = filters.session === "all" && !selectedSession && !selectedClass;
  const filteredEnrolled = sessionCapacityData.reduce(
    (total, capacityItem) => total + capacityItem.enrolled,
    0,
  );
  const filteredCapacity = sessionCapacityData.reduce(
    (total, capacityItem) => total + capacityItem.capacity,
    0,
  );
  const totalEnrolled = filtersAreGlobal
    ? (sessionsMetrics?.totalEnrolled ?? filteredEnrolled)
    : filteredEnrolled;
  const totalCapacity = filtersAreGlobal
    ? (sessionsMetrics?.totalCapacity ?? filteredCapacity)
    : filteredCapacity;
  const metricsCapacity = sessionsMetrics?.totalCapacity ?? 0;
  const metricsEnrolled = sessionsMetrics?.totalEnrolled ?? 0;
  const averageUtilization =
    filtersAreGlobal && metricsCapacity > 0
      ? ((metricsEnrolled / metricsCapacity) * 100).toFixed(1)
      : sessionCapacityData.length
        ? (
            sessionCapacityData.reduce((totalRate, capacityItem) => totalRate + capacityItem.rate, 0) /
            sessionCapacityData.length
          ).toFixed(1)
        : 0;

  const activeSessionsCount = sessionsMetrics?.active ?? 0;

  const capacityChartData: CapacityBarDatum[] = sessionCapacityData.map((capacityItem) => ({
    class: capacityItem.class,
    enrolled: capacityItem.enrolled,
    available: capacityItem.capacity - capacityItem.enrolled,
  }));

  const toggleSessionFilter = (sessionName: string): void => {
    setSelectedSession((currentSession) => (currentSession === sessionName ? null : sessionName));
  };

  const toggleClassFilter = (className: string): void => {
    setSelectedClass((currentClass) => (currentClass === className ? null : className));
  };

  if (isError) {
    return (
      <ErrorState
        title={t("sessions.loadFailed")}
        description={t("sessions.loadFailedHint")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ModuleCommandMetricsGrid
        items={[
          {
            icon: CalendarCheck,
            label: t("sessions.report.activeSessions"),
            value: activeSessionsCount,
            accent: "primary",
          },
          {
            icon: Users,
            label: t("sessions.report.totalEnrolled"),
            value: totalEnrolled,
            accent: "blue",
          },
          {
            icon: BarChart2,
            label: t("sessions.report.totalCapacity"),
            value: totalCapacity,
            accent: "violet",
          },
          {
            icon: TrendingUp,
            label: t("sessions.report.avgUtilisation"),
            value: `${averageUtilization}%`,
            accent: "green",
          },
        ]}
      />

      <SessionReportCharts
        capacityChartData={capacityChartData}
        enrollmentTrends={enrollmentTrends}
        onToggleClassFilter={toggleClassFilter}
        onToggleSessionFilter={toggleSessionFilter}
      />

      <SessionReportFilterBanner
        selectedSession={selectedSession}
        selectedClass={selectedClass}
        onClearSessionFilter={() => setSelectedSession(null)}
        onClearClassFilter={() => setSelectedClass(null)}
      />

      <SessionReportTable
        sessionCapacityData={sessionCapacityData}
        sessionStatusConfig={sessionStatusConfig}
        onToggleSessionFilter={toggleSessionFilter}
        onToggleClassFilter={toggleClassFilter}
      />

      <SessionReportDashboardWidgets todaysSessions={todaysSessions} />
    </div>
  );
}
