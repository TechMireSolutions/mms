import {
  getCollectedAmountForMonth,
  getOutstandingAmountForMonth,
} from '@mms/shared';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Distribution } from '@/lib/data/hasanatData';
import type { Session } from '@/lib/data/sessionsData';
import {
  getAttendanceRateForDate,
  getHasanatPointsInPeriod,
  getSessionsInPeriod,
  percentChange,
} from '@/tenant/features/dashboard/hooks/dashboardMetricUtils';

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

interface ComputeDashboardMetricTrendsArgs {
  studentsTotal: number;
  studentMetricsNew: number;
  teachersTotal: number;
  teacherMetricsNew: number;
  contactsTotal: number;
  contactMetricsNew: number;
  attendanceRecords: AttendanceRecord[];
  invoices: Parameters<typeof getCollectedAmountForMonth>[0];
  hasanatDistributions: Distribution[];
  denoms: { id: string; points: number }[] | undefined;
  sessions: Session[];
}

export function computeDashboardMetricTrends({
  studentsTotal,
  studentMetricsNew,
  teachersTotal,
  teacherMetricsNew,
  contactsTotal,
  contactMetricsNew,
  attendanceRecords,
  invoices,
  hasanatDistributions,
  denoms,
  sessions,
}: ComputeDashboardMetricTrendsArgs): DashboardMetricTrends {
  const studentTrend = studentsTotal && studentMetricsNew
    ? Math.round((studentMetricsNew / Math.max(1, studentsTotal - studentMetricsNew)) * 100)
    : 0;
  const teacherTrend = teachersTotal && teacherMetricsNew
    ? Math.round((teacherMetricsNew / Math.max(1, teachersTotal - teacherMetricsNew)) * 100)
    : 0;
  const contactTrend = contactsTotal && contactMetricsNew
    ? Math.round((contactMetricsNew / Math.max(1, contactsTotal - contactMetricsNew)) * 100)
    : 0;

  const sortedDates = [...new Set(attendanceRecords.map((record) => record.date as string))].sort();
  const latestDate = sortedDates[sortedDates.length - 1];
  const prevDate = sortedDates[sortedDates.length - 2];
  const latestRate = latestDate ? getAttendanceRateForDate(attendanceRecords, latestDate) : null;
  const prevRate = prevDate ? getAttendanceRateForDate(attendanceRecords, prevDate) : null;
  const attendanceTrend = (latestRate !== null && prevRate !== null && prevRate > 0)
    ? Math.round(latestRate - prevRate)
    : 0;

  const now = new Date();
  const currentMonthCollected = getCollectedAmountForMonth(invoices, now.getFullYear(), now.getMonth());
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthCollected = getCollectedAmountForMonth(
    invoices,
    prevMonthDate.getFullYear(),
    prevMonthDate.getMonth(),
  );
  const feesTrend = percentChange(currentMonthCollected, prevMonthCollected);

  const currentOutstanding = getOutstandingAmountForMonth(invoices, now.getFullYear(), now.getMonth());
  const prevOutstanding = getOutstandingAmountForMonth(
    invoices,
    prevMonthDate.getFullYear(),
    prevMonthDate.getMonth(),
  );
  const outstandingTrend = percentChange(currentOutstanding, prevOutstanding);

  const pointsMap = new Map<string, number>();
  (denoms || []).forEach((denom) => pointsMap.set(denom.id, denom.points));
  const pointsThisWeek = getHasanatPointsInPeriod(hasanatDistributions, pointsMap, 0, 7);
  const pointsLastWeek = getHasanatPointsInPeriod(hasanatDistributions, pointsMap, 7, 14);
  const hasanatTrend = percentChange(pointsThisWeek, pointsLastWeek);

  const sessionsThisWeek = getSessionsInPeriod(sessions, 0, 7);
  const sessionsLastWeek = getSessionsInPeriod(sessions, 7, 14);
  const sessionsTrend = percentChange(sessionsThisWeek, sessionsLastWeek);

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
