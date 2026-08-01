import { useMemo, useState } from "react";
import { CalendarCheck, Users, TrendingUp, BarChart2 } from "lucide-react";
import { useSessionsCollection, useSessionsMetrics } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { formatMonthName } from '@mms/shared';
import { StatCard } from "@/components/ui/StatCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { SessionReportCharts } from "./SessionReportCharts";
import { SessionReportDashboardWidgets } from "./SessionReportDashboardWidgets";
import { SessionReportFilterBanner } from "./SessionReportFilterBanner";
import { SessionReportTable } from "./SessionReportTable";

import type { CapacityBarDatum, EnrollmentTrendItem, SessionCapacityItem, SessionReportProps } from "./sessionReportTypes";

export type { EnrollmentTrendItem, SessionCapacityItem, SessionReportFilters, SessionReportProps } from "./sessionReportTypes";

/**
 * Renders session utilisation and capacity reports with stacked bar and
 * enrollment trend charts, plus a filterable session capacity table.
 *
 * @param props - The component props.
 * @returns The SessionReport component.
 */
export default function SessionReport({ filters }: SessionReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessionStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active: { label: t("sessions.status.active"), cls: SEMANTIC_BADGE.success },
    upcoming: { label: t("sessions.status.upcoming"), cls: SEMANTIC_BADGE.info },
    completed: { label: t("sessions.status.completed"), cls: SEMANTIC_BADGE.muted },
    cancelled: { label: t("sessions.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
  }), [t]);
  const sessions = useSessionsCollection();
  const { data: sessionsMetrics } = useSessionsMetrics();
  const enrollments = useEnrollmentsCollection();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const sessionCapacity = useMemo<SessionCapacityItem[]>(() => {
    const sessionCapacityRows: SessionCapacityItem[] = [];
    sessions.forEach((session) => {
      (session.classes || []).forEach((sessionClass) => {
        sessionCapacityRows.push({
          sessionId: session.id,
          classId: sessionClass.id,
          session: session.name,
          class: sessionClass.name,
          enrolled: sessionClass.enrolled,
          capacity: sessionClass.capacity,
          rate: sessionClass.capacity > 0 ? Math.round((sessionClass.enrolled / sessionClass.capacity) * 100) : 0,
          status: session.status
        });
      });
    });
    return sessionCapacityRows;
  }, [sessions]);

  const enrollmentTrends = useMemo<EnrollmentTrendItem[]>(() => {
    const counts: Record<number, number> = {};
    const sessionCountsByMonth: Record<number, Record<string, number>> = {};
    enrollments.forEach((enrollment) => {
      if (enrollment.enrolledDate) {
        const enrolledDate = new Date(enrollment.enrolledDate);
        if (!isNaN(enrolledDate.getTime())) {
          const m = enrolledDate.getMonth();
          counts[m] = (counts[m] || 0) + 1;
          const sessionName = sessions.find((session) => session.id === enrollment.sessionId)?.name ?? null;
          if (sessionName) {
            if (!sessionCountsByMonth[m]) sessionCountsByMonth[m] = {};
            sessionCountsByMonth[m][sessionName] = (sessionCountsByMonth[m][sessionName] || 0) + 1;
          }
        }
      }
    });

    const trends: EnrollmentTrendItem[] = [];
    for (let i = 0; i < 12; i++) {
      if (counts[i] !== undefined) {
        const monthName = formatMonthName(new Date(2023, i, 15));
        const monthSessions = sessionCountsByMonth[i] ?? {};
        const topSessionName = Object.entries(monthSessions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        trends.push({ month: monthName, students: counts[i], sessionName: topSessionName });
      }
    }
    if (trends.length === 0) {
      const currentMonthName = formatMonthName(new Date());
      return [{ month: currentMonthName, students: enrollments.length, sessionName: null }];
    }
    return trends;
  }, [enrollments, sessions]);

  const sessionCapacityData = useMemo<SessionCapacityItem[]>(() => {
    let filteredSessionCapacity = sessionCapacity;
    if (filters.session !== "all") {
      const targetSessionName = sessions.find((session) => session.id === filters.session)?.name;
      if (targetSessionName) {
        filteredSessionCapacity = filteredSessionCapacity.filter((capacityItem) => capacityItem.session === targetSessionName);
      }
    }
    if (selectedSession) {
      filteredSessionCapacity = filteredSessionCapacity.filter((capacityItem) => capacityItem.session === selectedSession);
    }
    if (selectedClass) {
      filteredSessionCapacity = filteredSessionCapacity.filter((capacityItem) => capacityItem.class === selectedClass);
    }
    return filteredSessionCapacity;
  }, [filters, sessionCapacity, sessions, selectedSession, selectedClass]);

  const filtersAreGlobal = filters.session === "all" && !selectedSession && !selectedClass;
  const filteredEnrolled = sessionCapacityData.reduce((total, capacityItem) => total + capacityItem.enrolled, 0);
  const filteredCapacity = sessionCapacityData.reduce((total, capacityItem) => total + capacityItem.capacity, 0);
  const totalEnrolled = filtersAreGlobal
    ? (sessionsMetrics?.totalEnrolled ?? filteredEnrolled)
    : filteredEnrolled;
  const totalCapacity = filtersAreGlobal
    ? (sessionsMetrics?.totalCapacity ?? filteredCapacity)
    : filteredCapacity;
  const metricsCapacity = sessionsMetrics?.totalCapacity ?? 0;
  const metricsEnrolled = sessionsMetrics?.totalEnrolled ?? 0;
  const averageUtilization = filtersAreGlobal && metricsCapacity > 0
    ? ((metricsEnrolled / metricsCapacity) * 100).toFixed(1)
    : sessionCapacityData.length
      ? (sessionCapacityData.reduce((totalRate, capacityItem) => totalRate + capacityItem.rate, 0) / sessionCapacityData.length).toFixed(1)
      : 0;

  const activeSessionsCount = sessionsMetrics?.active
    ?? sessions.filter((session) => session.status === "active").length;

  const capacityChartData: CapacityBarDatum[] = sessionCapacityData.map((capacityItem) => ({
    class:     capacityItem.class,
    enrolled:  capacityItem.enrolled,
    available: capacityItem.capacity - capacityItem.enrolled,
  }));

  const toggleSessionFilter = (sessionName: string): void => {
    setSelectedSession((currentSession) => (currentSession === sessionName ? null : sessionName));
  };

  const toggleClassFilter = (className: string): void => {
    setSelectedClass((currentClass) => (currentClass === className ? null : className));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={CalendarCheck} label={t("sessions.report.activeSessions")}  value={activeSessionsCount} color="primary" />
        <StatCard icon={Users}         label={t("sessions.report.totalEnrolled")}   value={totalEnrolled}    color="blue"    />
        <StatCard icon={BarChart2}     label={t("sessions.report.totalCapacity")}   value={totalCapacity}    color="violet"  />
        <StatCard icon={TrendingUp}    label={t("sessions.report.avgUtilisation")}  value={`${averageUtilization}%`} color="green"   />
      </div>

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

      <SessionReportDashboardWidgets />
    </div>
  );
}
