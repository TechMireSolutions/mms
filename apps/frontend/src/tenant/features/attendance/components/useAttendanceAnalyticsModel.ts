import { useMemo } from "react";
import type { AttendanceReportOverview } from '@mms/shared';
import {
  type AttendanceStatus,
} from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useAttendanceReportAggregates } from '@/tenant/hooks/collections/attendance';
import { useTranslation } from "@/hooks/useTranslation";
import { attendanceStatusLabel } from "@/lib/attendanceStatusUi";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";

export interface AnalyticsFilters {
  classId?: string;
}

export interface StudentRateEntry {
  id: string;
  name: string;
  rate: number;
}

export interface ClassStatEntry {
  name: string;
  rate: number;
  [key: string]: string | number;
}

function formatStudentName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || name;
  return `${parts[0]} ${parts[1]?.[0] ?? ''}.`;
}

export function useAttendanceAnalyticsModel(filters: AnalyticsFilters) {
  const { t } = useTranslation();
  const { statuses } = useAttendanceConfig();
  const { primary, secondary, charts } = useBrandPalette();
  const colors = useMemo(
    () => [primary, charts[0], secondary, charts[3]],
    [primary, secondary, charts],
  );
  const reportQuery = useAttendanceReportAggregates({ classId: filters.classId });
  const overview: AttendanceReportOverview | undefined = reportQuery.data?.overview;

  const classStats = useMemo<ClassStatEntry[]>(() =>
    (overview?.classRates ?? []).map((classRate) => ({
      name: classRate.className,
      rate: classRate.rate,
    })),
    [overview?.classRates]
  );

  const totalStats = useMemo(
    () => Object.fromEntries((overview?.statusCounts ?? []).map((item) => [item.status, item.count])),
    [overview?.statusCounts],
  );

  const monthlyTrend = useMemo(
    () => (overview?.monthlyTrend ?? []).map((month) => ({ month: month.monthKey, rate: month.rate })),
    [overview?.monthlyTrend],
  );

  const studentRates = useMemo<StudentRateEntry[]>(
    () => (overview?.studentRates ?? []).map((student) => ({
      id: student.studentId,
      name: formatStudentName(student.name || t("attendance.analytics.unknown")),
      rate: student.rate,
    })),
    [overview?.studentRates, t],
  );

  const lowAttendance = studentRates.filter((studentRate) => studentRate.rate < 75);
  const topStudents = (overview?.topPerformers ?? []).map((student) => ({
    id: student.studentId,
    name: formatStudentName(student.name || t("attendance.analytics.unknown")),
    rate: student.rate,
  }));

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
    overallRate: overview?.overallRate ?? 0,
    lowAttendanceCount: overview?.lowAttendanceCount ?? 0,
    monthlyTrend,
    studentRates,
    lowAttendance,
    topStudents,
    pieData,
    isLoading: reportQuery.isLoading,
    isError: reportQuery.isError,
    refetch: reportQuery.refetch,
  };
}
