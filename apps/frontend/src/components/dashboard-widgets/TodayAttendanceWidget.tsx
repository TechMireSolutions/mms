import React from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserCheck, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { AttendanceStatus } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useTranslation } from "@/hooks/useTranslation";
import { rateToneClass } from "@/lib/semanticTone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { type AppTranslationKey, todayISO, formatDate } from "@mms/shared";

// Type definitions


interface ClassBreakdown {
  classId: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

/**
 * TodayAttendanceWidget
 * 
 * Displays a summary of attendance records for the current day or the most recent day.
 * Includes overall statistics, status counts, and a breakdown by class.
 * 
 * @returns {React.ReactElement} The rendered widget component.
 */
export default function TodayAttendanceWidget({ title }: { title?: string }) {
  const { t } = useTranslation();
  const { statuses } = useAttendanceConfig();
  const attendanceRecords = useAttendanceRecordsCollection();
  const sessions = useSessionsCollection();

  const classNameMap = (() => {
    const map = new Map<string, string>();
    sessions.forEach((session) => {
      (session.classes || []).forEach((classInfo) => {
        if (classInfo.id && classInfo.name) {
          map.set(classInfo.id, classInfo.name);
        }
      });
    });
    return map;
  })();

  const today = todayISO();

  const todayRecords = (() =>
    attendanceRecords.filter((attendanceRecord) => attendanceRecord.date === today))();

  // Use most recent date if no records today (demo data)
  const displayRecords = (() => {
    if (todayRecords.length > 0) return todayRecords;
    const dates = Array.from(new Set(attendanceRecords.map((attendanceRecord) => attendanceRecord.date))).sort().reverse();
    return dates.length > 0 ? attendanceRecords.filter((attendanceRecord) => attendanceRecord.date === dates[0]) : [];
  })();

  const displayDate = displayRecords.length > 0 ? displayRecords[0].date : today;
  const isToday = displayDate === today;

  const stats = (() => {
    const counts: Record<string, number> = { total: displayRecords.length };
    displayRecords.forEach((attendanceRecord) => {
      counts[attendanceRecord.status] = (counts[attendanceRecord.status] || 0) + 1;
    });
    return counts;
  })();

  const rate = stats.total ? Math.round((((stats.present || 0) + (stats.late || 0)) / stats.total) * 100) : 0;

  // Per-class breakdown
  const classBreakdown = (() => {
    const attendanceByClassId: Record<string, Record<string, number>> = {};
    displayRecords.forEach((attendanceRecord) => {
      if (!attendanceByClassId[attendanceRecord.classId]) attendanceByClassId[attendanceRecord.classId] = { total: 0 };
      attendanceByClassId[attendanceRecord.classId][attendanceRecord.status] =
        (attendanceByClassId[attendanceRecord.classId][attendanceRecord.status] || 0) + 1;
      attendanceByClassId[attendanceRecord.classId].total++;
    });
    return Object.entries(attendanceByClassId).map(([classId, statusCounts]) => ({
      classId,
      name: classNameMap.get(classId) || classId,
      present: statusCounts.present || 0,
      absent: statusCounts.absent || 0,
      late: statusCounts.late || 0,
      excused: statusCounts.excused || 0,
      total: statusCounts.total,
      rate: statusCounts.total ? Math.round((((statusCounts.present || 0) + (statusCounts.late || 0)) / statusCounts.total) * 100) : 0,
    })) as ClassBreakdown[];
  })();

  const { text: rateColor, bar: rateBarColor } = rateToneClass(rate);

  return (
    <WidgetCard ariaLabelledby="todays-attendance-heading" accentColor="primary">
      <WidgetCardHeader
        variant="tinted"
        headingLevel={2}
        headingId="todays-attendance-heading"
        icon={<UserCheck className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />}
        title={title || (isToday ? t("dashboard.widgets.todaysAttendanceSummary") : t("dashboard.widgets.latestAttendanceSummary"))}
        badge={
          !isToday && (
            <Badge pill tone="muted" className="font-bold border-border/40">
              {formatDate(displayDate)}
            </Badge>
          )
        }
        actions={
          <Link to={ROUTES.attendance} className="inline-flex min-h-11 items-center gap-1 text-xs text-primary font-bold hover:underline">
            {t("dashboard.widgets.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <section className="p-5 space-y-4">
        {displayRecords.length === 0 ? (
          <EmptyState
            title={t("dashboard.widgets.noAttendanceRecorded")}
            icon={Users}
            compact
            className="uppercase tracking-wider"
            action={
              <Link to={ROUTES.attendance} className="inline-flex min-h-11 items-center text-xs text-primary font-bold hover:underline">
                {t("dashboard.widgets.markAttendance")}
              </Link>
            }
          />
        ) : (
          <>
            {/* Overall rate */}
            <div className="flex items-center gap-4 select-none">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-semibold">{t("dashboard.widgets.overallRate")}</span>
                  <span className={`text-sm font-bold tabular-nums ${rateColor}`}>{rate}%</span>
                </div>
                <ProgressBar
                  value={rate}
                  size="md"
                  fillClassName={`${rateBarColor} duration-700 ease-out`}
                  trackClassName="shadow-inner"
                  aria-hidden="true"
                />
              </div>
              <div className="text-end">
                <p className={`text-2xl font-black tabular-nums leading-none m-0 ${rateColor}`}>{rate}%</p>
                <p className="text-xs text-muted-foreground mt-1 m-0 font-medium">{t("dashboard.widgets.studentsCount", { count: stats.total })}</p>
              </div>
            </div>

            {/* Status pills */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-autofit-sm">
              {statuses.map((status: AttendanceStatus) => {
                const count = stats[status.id] || 0;
                return (
                  <div key={status.id} className={`min-w-0 rounded-xl ${status.bg} ${status.text} border ${status.border} px-2 py-2.5 text-center shadow-xs transition-all duration-300 interactive-scale`}>
                    <p className="text-base font-black tabular-nums leading-none mb-1">{count}</p>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-90 m-0 truncate">{t(`attendance.status.${status.id}` as AppTranslationKey)}</p>
                  </div>
                );
              })}
            </div>

            {/* Alert if high absence */}
            {(stats.absent || 0) > 2 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold select-none animate-pulse">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{t("dashboard.widgets.absentAlert", { count: stats.absent })}</span>
              </div>
            )}

            {/* Class breakdown */}
            <div className="space-y-3">
              <SectionLabel as="h3" tracking="wider" className="select-none">{t("dashboard.widgets.byClass")}</SectionLabel>
              {classBreakdown.map((classStats) => (
                <div key={classStats.classId} className="flex min-w-0 items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs font-bold text-foreground">{classStats.name}</span>
                  <ProgressBar
                    className="min-w-0 flex-1 gap-3"
                    value={classStats.rate}
                    size="md"
                    fillClassName={`${rateToneClass(classStats.rate).bar} duration-700 ease-out`}
                    trackClassName="shadow-inner"
                    label={`${classStats.rate}%`}
                    labelClassName={`w-10 text-end tabular-nums ${rateToneClass(classStats.rate).text}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </WidgetCard>
  );
}
