import { percentChange } from '@/tenant/features/dashboard/hooks/dashboardMetricUtils';
import type { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';

export interface DashboardMetricTrends {
  studentTrend: number;
  teacherTrend: number;
  contactTrend: number;
  attendanceTrend: number;
  feesTrend: number;
  outstandingTrend: number;
  hasanatTrend: number;
  sessionsTrend: number;
}

type DashboardData = ReturnType<typeof useDashboardData>;

/** Live trends from server `/metrics` snapshots — no full collection dumps. */
export function computeDashboardMetricTrends(data: DashboardData): DashboardMetricTrends {
  const {
    studentsTotal,
    studentMetricsNew,
    teachersTotal,
    teacherMetricsNew,
    contactsTotal,
    contactMetricsNew,
    attendanceMetrics,
    financeMetrics,
    hasanatMetrics,
    sessionsMetrics,
  } = data;

  const studentTrend = studentsTotal && studentMetricsNew
    ? Math.round((studentMetricsNew / Math.max(1, studentsTotal - studentMetricsNew)) * 100)
    : 0;
  const teacherTrend = teachersTotal && teacherMetricsNew
    ? Math.round((teacherMetricsNew / Math.max(1, teachersTotal - teacherMetricsNew)) * 100)
    : 0;
  const contactTrend = contactsTotal && contactMetricsNew
    ? Math.round((contactMetricsNew / Math.max(1, contactsTotal - contactMetricsNew)) * 100)
    : 0;

  const attendanceTrend =
    (attendanceMetrics?.selectedDatePresentRate ?? 0) - (attendanceMetrics?.priorDatePresentRate ?? 0);

  const feesTrend = percentChange(
    financeMetrics?.collectedThisMonth ?? 0,
    financeMetrics?.collectedPrevMonth ?? 0,
  );
  const outstandingTrend = percentChange(
    financeMetrics?.outstandingThisMonth ?? 0,
    financeMetrics?.outstandingPrevMonth ?? 0,
  );
  const hasanatTrend = percentChange(
    hasanatMetrics?.pointsThisWeek ?? 0,
    hasanatMetrics?.pointsLastWeek ?? 0,
  );
  const sessionsTrend = percentChange(
    sessionsMetrics?.sessionsThisWeek ?? 0,
    sessionsMetrics?.sessionsLastWeek ?? 0,
  );

  return {
    studentTrend,
    teacherTrend,
    contactTrend,
    attendanceTrend,
    feesTrend,
    outstandingTrend,
    hasanatTrend,
    sessionsTrend,
  };
}
