import React, { useMemo } from "react";
import { CalendarCheck, Users, TrendingUp, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { getIntlLocaleForLanguage } from '@mms/shared';
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";

import SessionsTable from "@/tenant/features/dashboard/components/widgets/SessionsTable";

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
  const { t, language } = useTranslation();
  const locale = getIntlLocaleForLanguage(language);
  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();

  const sessionCapacity = useMemo<SessionCapacityItem[]>(() => {
    const sessionCapacityRows: SessionCapacityItem[] = [];
    sessions.forEach((session) => {
      (session.classes || []).forEach((sessionClass) => {
        sessionCapacityRows.push({
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
    enrollments.forEach((enrollment) => {
      if (enrollment.enrolledDate) {
        const enrolledDate = new Date(enrollment.enrolledDate);
        if (!isNaN(enrolledDate.getTime())) {
          const m = enrolledDate.getMonth();
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    });

    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
    const trends: EnrollmentTrendItem[] = [];
    for (let i = 0; i < 12; i++) {
      if (counts[i] !== undefined) {
        const monthName = monthFormatter.format(new Date(2023, i, 15));
        trends.push({ month: monthName, students: counts[i] });
      }
    }
    if (trends.length === 0) {
      const currentMonthName = monthFormatter.format(new Date());
      return [{ month: currentMonthName, students: enrollments.length }];
    }
    return trends;
  }, [enrollments, locale]);

  const sessionCapacityData = useMemo<SessionCapacityItem[]>(() => {
    let filteredSessionCapacity = sessionCapacity;
    if (filters.session !== "all") {
      const targetSessionName = sessions.find((session) => session.id === filters.session)?.name;
      if (targetSessionName) {
        filteredSessionCapacity = filteredSessionCapacity.filter((capacityItem) => capacityItem.session === targetSessionName);
      }
    }
    return filteredSessionCapacity;
  }, [filters, sessionCapacity, sessions]);

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
            <BarChart data={capacityChartData} barSize={28}>
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
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name={t("sessions.report.studentsLabel")} />
            </LineChart>
          </SafeResponsiveContainer>
        </SectionCard>
      </div>

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
              {sessionCapacityData.map((sessionCapacity, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">{sessionCapacity.session}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{sessionCapacity.class}</td>
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
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold capitalize">
                      {sessionCapacity.status}
                    </span>
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
