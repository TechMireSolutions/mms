import React, { useMemo, useState } from "react";
import { CalendarCheck, Users, TrendingUp, BarChart2, Filter, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { formatMonthName } from '@mms/shared';
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

import SessionsTable from "@/components/dashboard-widgets/SessionsTable";

/** Active filter state passed down from the parent report view. */
interface SessionReportFilters {
  /** Selected session ID or "all" for no filter. */
  session: string;
}

/** Props for the SessionReport component. */
interface SessionReportProps {
  /** Active report filters. */
  filters: SessionReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

export interface SessionCapacityItem {
  sessionId: string;
  classId: string;
  session: string;
  class: string;
  enrolled: number;
  capacity: number;
  rate: number;
  status: string;
}

export interface EnrollmentTrendItem {
  month: string;
  students: number;
  sessionName: string | null;
}

/** Bar chart data shape derived from session capacity records. */
interface CapacityBarDatum {
  class: string;
  enrolled: number;
  available: number;
}

/**
 * Returns the appropriate colour class for a utilisation rate progress bar.
 *
 * @param rate - The utilisation percentage (0–100).
 * @returns A Tailwind background colour class.
 */
function utilisationColour(rate: number): string {
  if (rate >= 80) return "bg-success";
  if (rate >= 50) return "bg-warning";
  return "bg-destructive";
}

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

  const totalEnrolled  = sessionCapacityData.reduce((total, capacityItem) => total + capacityItem.enrolled, 0);
  const totalCapacity  = sessionCapacityData.reduce((total, capacityItem) => total + capacityItem.capacity, 0);
  const averageUtilization = sessionCapacityData.length
    ? (sessionCapacityData.reduce((totalRate, capacityItem) => totalRate + capacityItem.rate, 0) / sessionCapacityData.length).toFixed(1)
    : 0;

  const activeSessionsCount = sessions.filter((session) => session.status === "active").length;

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title={t("sessions.report.capacityByClass")}>
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart
              data={capacityChartData}
              barSize={28}
              onClick={(state) => {
                const className = (state as { activeLabel?: string } | undefined)?.activeLabel;
                if (typeof className === "string" && className.length > 0) toggleClassFilter(className);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="enrolled"  fill="hsl(var(--primary))" stackId="a" name={t("sessions.report.enrolledLabel")}  radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" fill="hsl(var(--muted))"   stackId="a" name={t("sessions.report.availableLabel")} radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeResponsiveContainer>
        </SectionCard>

        <SectionCard title={t("sessions.report.enrollmentTrend")}>
          <SafeResponsiveContainer width="100%" height={180}>
            <LineChart
              data={enrollmentTrends}
              onClick={(state) => {
                const trendPayload = (state as { activePayload?: Array<{ payload?: EnrollmentTrendItem }> } | undefined)?.activePayload?.[0]?.payload;
                if (trendPayload?.sessionName) toggleSessionFilter(trendPayload.sessionName);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name={t("sessions.report.studentsLabel")} />
            </LineChart>
          </SafeResponsiveContainer>
        </SectionCard>
      </div>

      {(selectedSession || selectedClass) && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-primary" />
            {selectedSession && (
              <>
                <span className="font-medium text-foreground">{t("sessions.report.sessionFilterLabel")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                  {selectedSession}
                </span>
              </>
            )}
            {selectedClass && (
              <>
                <span className="font-medium text-foreground">{t("sessions.report.classFilterLabel")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                  {selectedClass}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedSession && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSession(null)}
                className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 me-1" />
                {t("sessions.report.clearSessionFilter")}
              </Button>
            )}
            {selectedClass && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClass(null)}
                className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 me-1" />
                {t("sessions.report.clearClassFilter")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <ExportToolbar 
        title={t("sessions.report.capacityReportTitle")} 
        data={sessionCapacityData}
        headers={[
          t("sessions.report.colSession"),
          t("sessions.report.colClass"),
          t("sessions.report.colEnrolled"),
          t("sessions.report.colCapacity"),
          t("sessions.report.colUtilisation"),
          t("sessions.report.colStatus"),
        ]}
      />
      {sessionCapacityData.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("sessions.report.noData")} compact />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("sessions.report.colSession"),
                  t("sessions.report.colClass"),
                  t("sessions.report.colEnrolled"),
                  t("sessions.report.colCapacity"),
                  t("sessions.report.colUtilisation"),
                  t("sessions.report.colStatus"),
                ].map((headerLabel) => (
                  <th key={headerLabel} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessionCapacityData.map((sessionCapacity) => (
                <tr key={`${sessionCapacity.sessionId}-${sessionCapacity.classId}`} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleSessionFilter(sessionCapacity.session)}
                      className="h-auto px-0 py-0 max-w-[180px] truncate font-medium text-foreground hover:text-primary"
                    >
                      {sessionCapacity.session}
                    </Button>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleClassFilter(sessionCapacity.class)}
                      className="h-auto px-0 py-0 font-normal text-muted-foreground hover:text-primary"
                    >
                      {sessionCapacity.class}
                    </Button>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{sessionCapacity.enrolled}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{sessionCapacity.capacity}</td>
                  <td className="px-3 py-2.5 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-1.5 rounded-full ${utilisationColour(sessionCapacity.rate)}`}
                          style={{ width: `${sessionCapacity.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground">{sessionCapacity.rate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={sessionCapacity.status} config={sessionStatusConfig} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("sessions.report.dashboardWidgetTitle")}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("sessions.report.dashboardWidgetSubtitle")}</p>
        </div>
        <SessionsTable />
      </div>
    </div>
  );
}
