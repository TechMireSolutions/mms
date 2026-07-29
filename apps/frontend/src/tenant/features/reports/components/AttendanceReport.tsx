import React, { useMemo, useState } from "react";
import { UserCheck, Users, AlertTriangle, Award, Filter, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

import { AttendanceChart } from "@/components/dashboard-widgets/charts/AttendanceChart";
import TodayAttendanceWidget from "@/components/dashboard-widgets/TodayAttendanceWidget";
import { VisualizerConfig } from "@/tenant/features/reports/components/reportMetadata";

interface AttendanceReportProps {
  filters: {
    class: string;
    student: string;
  };
  onEditVisual: (config: VisualizerConfig) => void;
}

export interface AttendanceSummaryItem {
  class: string;
  total: number;
  avgRate: number;
  perfectAttendance: number;
  belowThreshold: number;
}

export interface StudentAttendanceItem {
  studentName: string;
  class: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

/**
 * Renders the attendance reports and metrics.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function AttendanceReport({ filters }: AttendanceReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const attendanceRecords = useAttendanceRecordsCollection();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const sessions = useSessionsCollection();
  const sessionClasses = useMemo(() => sessions.flatMap((session) => session.classes || []), [sessions]);

  const studentAttendanceRows = useMemo<StudentAttendanceItem[]>(() => {
    // Group records by student ID
    const attendanceByStudent: Record<string, StudentAttendanceItem> = {};
    
    attendanceRecords.forEach((attendanceRecord) => {
       const studentKey = attendanceRecord.studentId;
       if (!attendanceByStudent[studentKey]) {
         // Resolve class name
         const classInfo = sessionClasses.find((sessionClass) => sessionClass.id === attendanceRecord.classId);
         attendanceByStudent[studentKey] = {
           studentName: attendanceRecord.studentName,
           class: classInfo ? classInfo.name : attendanceRecord.classId,
           present: 0,
           absent: 0,
           late: 0,
           total: 0,
           rate: 0
         };
       }
       
       attendanceByStudent[studentKey].total++;
       if (attendanceRecord.status === "present" || attendanceRecord.status === "excused") attendanceByStudent[studentKey].present++;
       if (attendanceRecord.status === "absent") attendanceByStudent[studentKey].absent++;
       if (attendanceRecord.status === "late") {
         attendanceByStudent[studentKey].late++;
         attendanceByStudent[studentKey].present++; // Late is usually counted as present for general rating
       }
    });

    // Calculate rates
    const studentAttendanceRows = Object.values(attendanceByStudent).map((studentAttendance) => {
       studentAttendance.rate = studentAttendance.total > 0 ? Math.round((studentAttendance.present / studentAttendance.total) * 100) : 0;
       return studentAttendance;
     });

    let filteredAttendanceRows = studentAttendanceRows;
    // Note: We use class name for filtering here to match UI text filter if it's name-based, or ID if it's ID-based.
    // Assuming filters.class is the class ID, we should probably group by classId internally, but for display we need name.
    // Let's refine the filter:
    if (filters.class !== "all") {
       const targetClassName = sessionClasses.find((sessionClass) => sessionClass.id === filters.class)?.name;
       if (targetClassName) filteredAttendanceRows = filteredAttendanceRows.filter((studentAttendance) => studentAttendance.class === targetClassName);
    }
    if (filters.student) {
      filteredAttendanceRows = filteredAttendanceRows.filter((studentAttendance) => studentAttendance.studentName.toLowerCase().includes(filters.student.toLowerCase()));
    }
    return filteredAttendanceRows;
  }, [filters, attendanceRecords, sessionClasses]);

  const summary = useMemo<AttendanceSummaryItem[]>(() => {
     const classGroups: Record<string, { totalStudents: number, sumRates: number, perfect: number, below: number }> = {};

     studentAttendanceRows.forEach((studentAttendance) => {
       if (!classGroups[studentAttendance.class]) {
          classGroups[studentAttendance.class] = { totalStudents: 0, sumRates: 0, perfect: 0, below: 0 };
       }
       classGroups[studentAttendance.class].totalStudents++;
       classGroups[studentAttendance.class].sumRates += studentAttendance.rate;
       if (studentAttendance.rate === 100) classGroups[studentAttendance.class].perfect++;
       if (studentAttendance.rate < 75) classGroups[studentAttendance.class].below++;
     });

     return Object.entries(classGroups).map(([className, classGroup]) => ({
       class: className,
       total: classGroup.totalStudents,
       avgRate: classGroup.totalStudents > 0 ? Math.round(classGroup.sumRates / classGroup.totalStudents) : 0,
       perfectAttendance: classGroup.perfect,
       belowThreshold: classGroup.below
     }));
  }, [studentAttendanceRows]);

  const filteredSummary = useMemo(
    () => (selectedClass ? summary.filter((summaryItem) => summaryItem.class === selectedClass) : summary),
    [summary, selectedClass],
  );

  const filteredStudentAttendanceRows = useMemo(
    () =>
      selectedClass
        ? studentAttendanceRows.filter((studentAttendance) => studentAttendance.class === selectedClass)
        : studentAttendanceRows,
    [studentAttendanceRows, selectedClass],
  );

  const avgRate = filteredSummary.length
    ? (filteredSummary.reduce((totalRate, summaryItem) => totalRate + summaryItem.avgRate, 0) / filteredSummary.length).toFixed(1)
    : "0";
    
  const perfect = filteredSummary.reduce((totalPerfect, summaryItem) => totalPerfect + summaryItem.perfectAttendance, 0);
  const belowThreshold = filteredSummary.reduce((totalBelowThreshold, summaryItem) => totalBelowThreshold + summaryItem.belowThreshold, 0);

  const toggleClassFilter = (className: string): void => {
    setSelectedClass((currentClass) => (currentClass === className ? null : className));
  };

  const rateColor = (rate: number): string => {
    if (rate >= 90) return "text-success";
    if (rate >= 75) return "text-warning";
    return "text-destructive";
  };

  const rateBar = (rate: number): React.JSX.Element => {
    const color = rate >= 90 ? "bg-success" : rate >= 75 ? "bg-warning" : "bg-destructive";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${rate}%` }} />
        </div>
        <span className={`text-xs font-bold ${rateColor(rate)}`}>{rate}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-start">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={UserCheck} label={t("attendance.report.avgAttendance")} value={`${avgRate}%`} color="green" />
        <StatCard icon={Users} label={t("attendance.report.classesCount")} value={filteredSummary.length} color="primary" />
        <StatCard icon={Award} label={t("attendance.report.perfectAttendance")} value={perfect} color="amber" />
        <StatCard icon={AlertTriangle} label={t("attendance.report.belowThreshold")} value={belowThreshold} color="red" />
      </div>

      {/* Chart */}
      {filteredSummary.length > 0 && (
        <SectionCard title={t("attendance.report.rateByClass")}>
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart
              data={filteredSummary}
              barSize={36}
              onClick={(state) => {
                const className = (state as { activeLabel?: string } | undefined)?.activeLabel;
                if (typeof className === "string" && className.length > 0) toggleClassFilter(className);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="class" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ""} />
              <Bar dataKey="avgRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeResponsiveContainer>
        </SectionCard>
      )}

      {selectedClass && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">{t("attendance.report.classFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {selectedClass}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedClass(null)}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {t("attendance.report.clearClassFilter")}
          </Button>
        </div>
      )}

      {/* Class Summary Table */}
      <ExportToolbar 
        title={t("attendance.report.summaryTitle")} 
        data={filteredSummary}
        headers={[
          t("attendance.report.colClass"),
          t("attendance.report.colTotalStudents"),
          t("attendance.report.colAvgRate"),
          t("attendance.report.colPerfectAttendance"),
          t("attendance.report.colBelowThreshold"),
        ]}
      />
      {filteredSummary.length === 0 ? (
        <EmptyState icon={UserCheck} title={t("attendance.report.noData")} description={t("attendance.report.adjustFilters")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {filteredSummary.map((summaryRow) => (
              <article key={summaryRow.class} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleClassFilter(summaryRow.class)}
                  className="h-auto min-h-11 px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
                >
                  {summaryRow.class}
                </Button>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colTotalStudents")}</dt>
                    <dd className="text-foreground">{summaryRow.total}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colAvgRate")}</dt>
                    <dd>{rateBar(summaryRow.avgRate)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colPerfectAttendance")}</dt>
                    <dd>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">{summaryRow.perfectAttendance}</span>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colBelowThreshold")}</dt>
                    <dd>
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">{summaryRow.belowThreshold}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("attendance.report.colClass"),
                  t("attendance.report.colTotalStudents"),
                  t("attendance.report.colAvgRate"),
                  t("attendance.report.colPerfectAttendance"),
                  t("attendance.report.colBelowThreshold"),
                ].map((headerLabel) => (
                  <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSummary.map((summaryRow) => (
                <tr key={summaryRow.class} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium text-foreground">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleClassFilter(summaryRow.class)}
                      className="h-auto px-0 py-0 font-medium text-foreground hover:text-primary"
                    >
                      {summaryRow.class}
                    </Button>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{summaryRow.total}</td>
                  <td className="px-3 py-3 w-44">{rateBar(summaryRow.avgRate)}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">{summaryRow.perfectAttendance}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">{summaryRow.belowThreshold}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* Student Attendance */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("attendance.report.studentDetailTitle")}</h3>
        <ExportToolbar 
          title={t("attendance.report.studentDetailTitle")} 
          data={filteredStudentAttendanceRows}
          headers={[
            t("attendance.report.colStudent"),
            t("attendance.report.colStudentClass"),
            t("attendance.report.colPresent"),
            t("attendance.report.colAbsent"),
            t("attendance.report.colLate"),
            t("attendance.report.colTotal"),
            t("attendance.report.colRate"),
          ]}
        />
      </div>
      {filteredStudentAttendanceRows.length === 0 ? (
        <EmptyState icon={Users} title={t("attendance.report.noStudentRecords")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {filteredStudentAttendanceRows.map((studentAttendance) => (
              <article key={studentAttendance.studentName} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-foreground">{studentAttendance.studentName}</h4>
                  <div className="w-24 shrink-0">{rateBar(studentAttendance.rate)}</div>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colStudentClass")}</dt>
                    <dd className="text-foreground">{studentAttendance.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colTotal")}</dt>
                    <dd className="text-muted-foreground">{studentAttendance.total}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colPresent")}</dt>
                    <dd className="font-medium text-success">{studentAttendance.present}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colAbsent")}</dt>
                    <dd className="font-medium text-destructive">{studentAttendance.absent}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colLate")}</dt>
                    <dd className="font-medium text-warning">{studentAttendance.late}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("attendance.report.colStudent"),
                  t("attendance.report.colStudentClass"),
                  t("attendance.report.colPresent"),
                  t("attendance.report.colAbsent"),
                  t("attendance.report.colLate"),
                  t("attendance.report.colTotal"),
                  t("attendance.report.colRate"),
                ].map((headerLabel) => (
                  <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudentAttendanceRows.map((studentAttendance) => (
                <tr key={studentAttendance.studentName} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium text-foreground">{studentAttendance.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{studentAttendance.class}</td>
                  <td className="px-3 py-2.5 text-success font-medium">{studentAttendance.present}</td>
                  <td className="px-3 py-2.5 text-destructive font-medium">{studentAttendance.absent}</td>
                  <td className="px-3 py-2.5 text-warning font-medium">{studentAttendance.late}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{studentAttendance.total}</td>
                  <td className="px-3 py-2.5 w-32">{rateBar(studentAttendance.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("attendance.report.dashboardWidgetsTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("attendance.report.dashboardWidgetsSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AttendanceChart />
          <TodayAttendanceWidget />
        </div>
      </div>
    </div>
  );
}
