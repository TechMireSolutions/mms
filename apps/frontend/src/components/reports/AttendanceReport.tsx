import React, { useMemo } from "react";
import { UserCheck, Users, AlertTriangle, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useSessionsCollection } from "@/hooks/useSessions";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import { EmptyState } from "../ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";

import { AttendanceChart } from "@/components/widgets/charts/AttendanceChart";
import TodayAttendanceWidget from "@/components/widgets/TodayAttendanceWidget";
import { VisualizerConfig } from "./reportMetadata";

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
  const records = useAttendanceRecordsCollection();

  const sessions = useSessionsCollection();
  const allClasses = useMemo(() => sessions.flatMap((session) => session.classes || []), [sessions]);

  const studentAtt = useMemo<StudentAttendanceItem[]>(() => {
    // Group records by student ID
    const attendanceByStudent: Record<string, StudentAttendanceItem> = {};
    
    records.forEach((record) => {
       const studentKey = record.studentId;
       if (!attendanceByStudent[studentKey]) {
         // Resolve class name
         const classInfo = allClasses.find((sessionClass) => sessionClass.id === record.classId);
         attendanceByStudent[studentKey] = {
           studentName: record.studentName,
           class: classInfo ? classInfo.name : record.classId,
           present: 0,
           absent: 0,
           late: 0,
           total: 0,
           rate: 0
         };
       }
       
       attendanceByStudent[studentKey].total++;
       if (record.status === "present" || record.status === "excused") attendanceByStudent[studentKey].present++;
       if (record.status === "absent") attendanceByStudent[studentKey].absent++;
       if (record.status === "late") {
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
       const targetClassName = allClasses.find((sessionClass) => sessionClass.id === filters.class)?.name;
       if (targetClassName) filteredAttendanceRows = filteredAttendanceRows.filter((studentAttendance) => studentAttendance.class === targetClassName);
    }
    if (filters.student) {
      filteredAttendanceRows = filteredAttendanceRows.filter((studentAttendance) => studentAttendance.studentName.toLowerCase().includes(filters.student.toLowerCase()));
    }
    return filteredAttendanceRows;
  }, [filters, records, allClasses]);

  const summary = useMemo<AttendanceSummaryItem[]>(() => {
     const classGroups: Record<string, { totalStudents: number, sumRates: number, perfect: number, below: number }> = {};

     studentAtt.forEach((studentAttendance) => {
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
  }, [studentAtt]);

  const avgRate = summary.length
    ? (summary.reduce((totalRate, summaryItem) => totalRate + summaryItem.avgRate, 0) / summary.length).toFixed(1)
    : "0";
    
  const perfect = summary.reduce((totalPerfect, summaryItem) => totalPerfect + summaryItem.perfectAttendance, 0);
  const belowThreshold = summary.reduce((totalBelowThreshold, summaryItem) => totalBelowThreshold + summaryItem.belowThreshold, 0);

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
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={UserCheck} label={t("attendance.report.avgAttendance")} value={`${avgRate}%`} color="green" />
        <ReportSummaryCard icon={Users} label={t("attendance.report.classesCount")} value={summary.length} color="primary" />
        <ReportSummaryCard icon={Award} label={t("attendance.report.perfectAttendance")} value={perfect} color="amber" />
        <ReportSummaryCard icon={AlertTriangle} label={t("attendance.report.belowThreshold")} value={belowThreshold} color="red" />
      </div>

      {/* Chart */}
      {summary.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("attendance.report.rateByClass")}</p>
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart data={summary} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="class" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ""} />
              <Bar dataKey="avgRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeResponsiveContainer>
        </div>
      )}

      {/* Class Summary Table */}
      <ReportExportBar 
        title={t("attendance.report.summaryTitle")} 
        data={summary}
        headers={[
          t("attendance.report.colClass"),
          t("attendance.report.colTotalStudents"),
          t("attendance.report.colAvgRate"),
          t("attendance.report.colPerfectAttendance"),
          t("attendance.report.colBelowThreshold"),
        ]}
      />
      {summary.length === 0 ? (
        <EmptyState icon={UserCheck} title={t("attendance.report.noData")} description={t("attendance.report.adjustFilters")} compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm">
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
                  <th key={headerLabel} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.map((summaryRow) => (
                <tr key={summaryRow.class} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium text-foreground">{summaryRow.class}</td>
                  <td className="px-3 py-3 text-muted-foreground">{summaryRow.total}</td>
                  <td className="px-3 py-3 w-44">{rateBar(summaryRow.avgRate)}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">{summaryRow.perfectAttendance}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold">{summaryRow.belowThreshold}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Attendance */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("attendance.report.studentDetailTitle")}</h3>
        <ReportExportBar 
          title={t("attendance.report.studentDetailTitle")} 
          data={studentAtt}
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
      {studentAtt.length === 0 ? (
        <EmptyState icon={Users} title={t("attendance.report.noStudentRecords")} compact />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
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
                  <th key={headerLabel} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentAtt.map((studentAttendance) => (
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
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("attendance.report.dashboardWidgetsTitle")}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("attendance.report.dashboardWidgetsSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AttendanceChart />
          <TodayAttendanceWidget />
        </div>
      </div>
    </div>
  );
}
