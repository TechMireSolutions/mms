import { useMemo } from "react";
import {
  calcClassStats,
  calcStudentRate,
  getMonthlyTrend,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { useStudentsByIds } from '@/tenant/hooks/collections/students';
import { useTranslation } from "@/hooks/useTranslation";
import { attendanceStatusLabel } from "@/lib/attendanceStatusUi";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";

export interface AnalyticsFilters {
  classId?: string;
}

export interface StudentRateEntry {
  name: string;
  rate: number;
}

export interface ClassStatEntry {
  name: string;
  rate: number;
  [key: string]: string | number;
}

export function useAttendanceAnalyticsModel(filters: AnalyticsFilters, records: AttendanceRecord[]) {
  const { t } = useTranslation();
  const { statuses } = useAttendanceConfig();
  const { primary, secondary, charts } = useBrandPalette();
  const colors = useMemo(
    () => [primary, charts[0], secondary, charts[3]],
    [primary, secondary, charts],
  );
  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();

  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const classesToShow = filters.classId
    ? allClasses.filter((sessionClass) => sessionClass.id === filters.classId)
    : allClasses;

  const classStats = useMemo<ClassStatEntry[]>(() =>
    classesToShow.map((sessionClass) => ({
      name: sessionClass.name,
      ...calcClassStats(sessionClass.id, records),
    })),
    [classesToShow, records]
  );

  const totalStats = useMemo(() => {
    return classStats.reduce(
      (totals, classStat) => {
        Object.keys(classStat).forEach((key) => {
          if (key !== "name" && key !== "rate") {
            totals[key] = (totals[key] || 0) + (classStat[key as keyof typeof classStat] as number || 0);
          }
        });
        return totals;
      },
      {} as Record<string, number>
    );
  }, [classStats]);

  const overallRate = useMemo(() => {
    const totalPresent = (totalStats.present || 0) + (totalStats.late || 0);
    const totalAll = Object.keys(totalStats).reduce((sum, key) => sum + (totalStats[key] || 0), 0);
    return totalAll ? Math.round((totalPresent / totalAll) * 100) : 0;
  }, [totalStats]);

  const trendClassId = filters.classId || classesToShow[0]?.id || "";
  const monthlyTrend = useMemo(() => getMonthlyTrend(trendClassId, records), [trendClassId, records]);

  const studentIds = useMemo(() => {
    if (!trendClassId) return [];
    return enrollments
      .filter((enrollment) =>
        enrollment.classId === trendClassId &&
        enrollment.status !== "cancelled" &&
        enrollment.status !== "completed"
      )
      .map((enrollment) => enrollment.studentId);
  }, [enrollments, trendClassId]);

  const { data: students = [] } = useStudentsByIds(studentIds);

  const studentRates = useMemo<StudentRateEntry[]>(() =>
    students.map((student: any) => {
      const studentName = student.name || t("attendance.analytics.unknown");
      return {
        name: studentName.split(" ")[0] + " " + (studentName.split(" ")[1]?.[0] ?? "") + ".",
        rate: calcStudentRate(student.id, records),
      };
    }).sort((firstStudent: any, secondStudent: any) => firstStudent.rate - secondStudent.rate),
    [students, records, t]
  );

  const lowAttendance = studentRates.filter((studentRate) => studentRate.rate < 75);
  const topStudents = [...studentRates].sort((firstStudent: any, secondStudent: any) => secondStudent.rate - firstStudent.rate).slice(0, 3);

  const pieData = useMemo(() =>
    statuses.map((status: AttendanceStatus) => ({
      name: attendanceStatusLabel(status, t),
      value: totalStats[status.id] ?? 0,
    })),
    [statuses, totalStats, t]
  );

  return {
    t,
    statuses,
    colors,
    classStats,
    totalStats,
    overallRate,
    monthlyTrend,
    studentRates,
    lowAttendance,
    topStudents,
    pieData,
  };
}
