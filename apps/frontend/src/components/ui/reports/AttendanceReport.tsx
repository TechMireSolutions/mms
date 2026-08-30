import React, { lazy, Suspense, useMemo, useState } from "react";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import PinnedWidgets from "./PinnedWidgets";

const AttendanceReportCharts = lazy(() =>
  import("./AttendanceReportCharts").then((m) => ({ default: m.AttendanceReportCharts })),
);
import { ReportFilterBanner } from "./ReportFilterBanner";
import { AttendanceReportTables } from "./AttendanceReportTables";

import type { AttendanceReportProps, AttendanceSummaryItem, StudentAttendanceItem } from "./attendanceReportTypes";

export type { AttendanceReportProps, AttendanceSummaryItem, StudentAttendanceItem } from "./attendanceReportTypes";

/**
 * Renders the attendance reports and metrics.
 */
const AttendanceReport = React.memo(function AttendanceReport({ filters }: AttendanceReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const attendanceRecords = useAttendanceRecordsCollection();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const sessions = useSessionsCollection();
  const sessionClasses = useMemo(() => sessions.flatMap((session) => session.classes || []), [sessions]);

  const studentAttendanceRows = useMemo<StudentAttendanceItem[]>(() => {
    const attendanceByStudent: Record<string, StudentAttendanceItem> = {};

    attendanceRecords.forEach((attendanceRecord) => {
      const studentKey = attendanceRecord.studentId;
      if (!attendanceByStudent[studentKey]) {
        const classInfo = sessionClasses.find((sessionClass) => sessionClass.id === attendanceRecord.classId);
        attendanceByStudent[studentKey] = {
          studentName: attendanceRecord.studentName,
          class: classInfo ? classInfo.name : attendanceRecord.classId,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          rate: 0,
        };
      }

      attendanceByStudent[studentKey].total++;
      if (attendanceRecord.status === "present" || attendanceRecord.status === "excused") attendanceByStudent[studentKey].present++;
      if (attendanceRecord.status === "absent") attendanceByStudent[studentKey].absent++;
      if (attendanceRecord.status === "late") {
        attendanceByStudent[studentKey].late++;
        attendanceByStudent[studentKey].present++;
      }
    });

    return Object.values(attendanceByStudent).map((studentAttendance) => ({
      ...studentAttendance,
      rate: studentAttendance.total > 0 ? Math.round((studentAttendance.present / studentAttendance.total) * 100) : 0,
    }));
  }, [attendanceRecords, sessionClasses]);

  const summary = useMemo<AttendanceSummaryItem[]>(() => {
    const classGroups: Record<string, { totalStudents: number; sumRates: number; perfect: number; below: number }> = {};

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
      belowThreshold: classGroup.below,
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
        : studentAttendanceRows.filter((row) => {
            const matchesClass = filters.class === "all" || sessionClasses.find((c) => c.name === row.class)?.id === filters.class;
            const matchesStudent = !filters.student || row.studentName.toLowerCase().includes(filters.student.toLowerCase());
            return matchesClass && matchesStudent;
          }),
    [studentAttendanceRows, selectedClass, filters, sessionClasses],
  );

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
      <ProgressBar
        value={rate}
        fillClassName={color}
        label={`${rate}%`}
        labelClassName={rateColor(rate)}
      />
    );
  };

  return (
    <div className="space-y-4 text-start">
      <Suspense fallback={<Skeleton className="h-chart-sm w-full rounded-xl" />}>
        <AttendanceReportCharts summary={filteredSummary} onToggleClassFilter={toggleClassFilter} />
      </Suspense>
      <ReportFilterBanner
        filters={[
          selectedClass
            ? {
                key: "class",
                label: t("attendance.report.classFilterLabel"),
                value: selectedClass,
                onClear: () => setSelectedClass(null),
                clearLabel: t("attendance.report.clearClassFilter"),
              }
            : null,
        ]}
      />
      <AttendanceReportTables
        summary={filteredSummary}
        studentAttendanceRows={filteredStudentAttendanceRows}
        rateBar={rateBar}
        onToggleClassFilter={toggleClassFilter}
      />
      <PinnedWidgets category="attendance" />
    </div>
  );
});

export default AttendanceReport;
