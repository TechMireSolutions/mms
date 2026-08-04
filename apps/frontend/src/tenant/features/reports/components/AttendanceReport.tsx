import { useMemo, useState } from "react";
import { UserCheck, Users, AlertTriangle, Award } from "lucide-react";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { AttendanceReportCharts } from "./AttendanceReportCharts";
import { AttendanceReportDashboardWidgets } from "./AttendanceReportDashboardWidgets";
import { AttendanceReportFilterBanner } from "./AttendanceReportFilterBanner";
import { AttendanceReportTables } from "./AttendanceReportTables";

import type { AttendanceReportProps, AttendanceSummaryItem, StudentAttendanceItem } from "./attendanceReportTypes";

export type { AttendanceReportProps, AttendanceSummaryItem, StudentAttendanceItem } from "./attendanceReportTypes";

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
      <ModuleCommandMetricsGrid
        items={[
          { icon: UserCheck, label: t("attendance.report.avgAttendance"), value: `${avgRate}%`, accent: "green" },
          { icon: Users, label: t("attendance.report.classesCount"), value: filteredSummary.length, accent: "primary" },
          { icon: Award, label: t("attendance.report.perfectAttendance"), value: perfect, accent: "amber" },
          { icon: AlertTriangle, label: t("attendance.report.belowThreshold"), value: belowThreshold, accent: "red" },
        ]}
      />

      <AttendanceReportCharts summary={filteredSummary} onToggleClassFilter={toggleClassFilter} />
      <AttendanceReportFilterBanner selectedClass={selectedClass} onClearClassFilter={() => setSelectedClass(null)} />
      <AttendanceReportTables
        summary={filteredSummary}
        studentAttendanceRows={filteredStudentAttendanceRows}
        rateBar={rateBar}
        onToggleClassFilter={toggleClassFilter}
      />
      <AttendanceReportDashboardWidgets />
    </div>
  );
}
