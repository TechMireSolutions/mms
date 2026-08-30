import React, { lazy, Suspense, useMemo, useState } from "react";
import { useSessions, useSessionsCollection, useSessionsReportAggregates } from "@/tenant/hooks/collections/sessions";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import { SessionReportTable } from "./SessionReportTable";
import { SessionReportDashboardWidgets } from "./SessionReportDashboardWidgets";
import { ReportFilterBanner } from "./ReportFilterBanner";
import PinnedWidgets from "./PinnedWidgets";

const SessionReportCharts = lazy(() =>
  import("./SessionReportCharts").then((mod) => ({ default: mod.SessionReportCharts })),
);

import {
  buildEnrollmentTrends,
  buildSessionCapacityData,
  buildTodaysSessions,
  buildSessionStatusConfig,
} from "./sessionReportUtils";

import type {
  CapacityChartItem,
  EnrollmentTrendItem,
  SessionCapacityItem,
  SessionReportProps,
  TodaySessionItem,
} from "./sessionReportTypes";

export type {
  CapacityChartItem,
  EnrollmentTrendItem,
  SessionCapacityItem,
  SessionReportFilters,
  SessionReportProps,
  TodaySessionItem,
} from "./sessionReportTypes";

/**
 * Renders the session reports and capacity metrics, including utilization bar charts,
 * enrollment trend lines, and a filterable capacity data grid.
 */
const SessionReport = React.memo(function SessionReport({ filters }: SessionReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const { isError, refetch } = useSessions();
  const sessions = useSessionsCollection();
  const aggregatesQuery = useSessionsReportAggregates();
  const aggregates = aggregatesQuery.data?.status === 200 ? aggregatesQuery.data.body : undefined;
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const sessionStatusConfig = useMemo(() => buildSessionStatusConfig(t), [t]);

  const rawSessionCapacityData = useMemo<SessionCapacityItem[]>(() => {
    if (aggregates && Array.isArray((aggregates as any).capacity) && (aggregates as any).capacity.length > 0) {
      return (aggregates as any).capacity as SessionCapacityItem[];
    }
    return buildSessionCapacityData(sessions);
  }, [aggregates, sessions]);

  const capacityChartData = useMemo<CapacityChartItem[]>(() => {
    return rawSessionCapacityData.map((item: SessionCapacityItem) => ({
      class: item.class,
      enrolled: item.enrolled,
      available: Math.max(0, item.capacity - item.enrolled),
    }));
  }, [rawSessionCapacityData]);

  const enrollmentTrends = useMemo<EnrollmentTrendItem[]>(() => {
    if (aggregates && Array.isArray((aggregates as any).enrollmentTrends) && (aggregates as any).enrollmentTrends.length > 0) {
      return ((aggregates as any).enrollmentTrends as Array<{ monthKey: string; students: number; sessionName: string | null }>).map((trend) => ({
        month: trend.monthKey,
        students: trend.students,
        sessionName: trend.sessionName,
      }));
    }
    return buildEnrollmentTrends(sessions);
  }, [aggregates, sessions]);

  const sessionCapacityData = useMemo<SessionCapacityItem[]>(() => {
    let filteredData = rawSessionCapacityData;

    if (filters.session && filters.session !== "all") {
      filteredData = filteredData.filter((item) => item.sessionId === filters.session);
    }
    if (filters.class && filters.class !== "all") {
      filteredData = filteredData.filter((item) => item.classId === filters.class);
    }
    if (filters.status && filters.status !== "all") {
      filteredData = filteredData.filter((item) => item.status === filters.status);
    }
    if (selectedSession) {
      filteredData = filteredData.filter((item) => item.session === selectedSession);
    }
    if (selectedClass) {
      filteredData = filteredData.filter((item) => item.class === selectedClass);
    }

    return filteredData;
  }, [filters, rawSessionCapacityData, selectedSession, selectedClass]);

  const todaysSessions = useMemo<TodaySessionItem[]>(() => {
    if (aggregates && Array.isArray((aggregates as any).todaysSessions) && (aggregates as any).todaysSessions.length > 0) {
      return (aggregates as any).todaysSessions as TodaySessionItem[];
    }
    return buildTodaysSessions(sessions);
  }, [aggregates, sessions]);

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
      <Suspense fallback={<Skeleton className="h-chart-md w-full rounded-xl" />}>
        <SessionReportCharts
          capacityChartData={capacityChartData}
          enrollmentTrends={enrollmentTrends}
          onToggleClassFilter={toggleClassFilter}
          onToggleSessionFilter={toggleSessionFilter}
        />
      </Suspense>

      <ReportFilterBanner
        filters={[
          selectedSession
            ? {
                key: "session",
                label: t("sessions.report.sessionFilterLabel"),
                value: selectedSession,
                onClear: () => setSelectedSession(null),
                clearLabel: t("sessions.report.clearSessionFilter"),
              }
            : null,
          selectedClass
            ? {
                key: "class",
                label: t("sessions.report.classFilterLabel"),
                value: selectedClass,
                onClear: () => setSelectedClass(null),
                clearLabel: t("sessions.report.clearClassFilter"),
              }
            : null,
        ]}
      />

      <SessionReportTable
        sessionCapacityData={sessionCapacityData}
        sessionStatusConfig={sessionStatusConfig}
        onToggleSessionFilter={toggleSessionFilter}
        onToggleClassFilter={toggleClassFilter}
      />

      <SessionReportDashboardWidgets todaysSessions={todaysSessions} />
      <PinnedWidgets category="sessions" />
    </div>
  );
});

export default SessionReport;
