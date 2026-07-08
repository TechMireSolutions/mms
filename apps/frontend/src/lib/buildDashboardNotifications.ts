import { type AppTranslationKey, formatMoney } from '@mms/shared';
import type { DashboardRole } from '@/lib/dashboardRole';
import type { Invoice } from '@/lib/data/financeData';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

export interface DashboardNotificationItem {
  id: string;
  type: 'fee' | 'event' | 'student' | 'attendance' | string;
  title: string;
  desc: string;
  time: string;
  urgent?: boolean;
}

type Translate = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

function sumOutstanding(invoices: Invoice[]): number {
  return invoices.reduce((sum, invoice) => {
    if (invoice.status === 'cancelled' || invoice.status === 'paid') return sum;
    if (invoice.status === 'partial') {
      return sum + Math.max(0, Number(invoice.finalAmt || 0) - Number(invoice.paidAmt || 0));
    }
    return sum + Number(invoice.finalAmt || 0);
  }, 0);
}

function countOpenInvoices(invoices: Invoice[]): number {
  return invoices.filter(
    (invoice) =>
      invoice.status === 'pending' || invoice.status === 'overdue' || invoice.status === 'partial',
  ).length;
}

function todayAttendanceRate(attendanceRecords: AttendanceRecord[]): number | null {
  const today = new Date().toISOString().slice(0, 10);
  let attendanceRecordsForDay = attendanceRecords.filter((attendanceRecord) => attendanceRecord.date === today);
  if (attendanceRecordsForDay.length === 0) {
    const attendanceDates = [...new Set(attendanceRecords.map((attendanceRecord) => attendanceRecord.date))]
      .sort()
      .reverse();
    if (attendanceDates.length === 0) return null;
    attendanceRecordsForDay = attendanceRecords.filter(
      (attendanceRecord) => attendanceRecord.date === attendanceDates[0],
    );
  }
  if (attendanceRecordsForDay.length === 0) return null;
  const presentOrLateCount = attendanceRecordsForDay.filter(
    (attendanceRecord) => attendanceRecord.status === 'present' || attendanceRecord.status === 'late',
  ).length;
  return Math.round((presentOrLateCount / attendanceRecordsForDay.length) * 100);
}

export function buildDashboardNotifications(
  dashboardRole: DashboardRole,
  dashboardNotificationInput: {
    invoices: Invoice[];
    attendanceRecords: AttendanceRecord[];
    inactiveStudents: number;
  },
  t: Translate,
  formatCurrency?: (amount: number | string | null | undefined) => string,
): DashboardNotificationItem[] {
  const dashboardNotifications: DashboardNotificationItem[] = [];
  const unpaidCount = countOpenInvoices(dashboardNotificationInput.invoices);
  const outstandingTotal = sumOutstanding(dashboardNotificationInput.invoices);
  const attendanceRate = todayAttendanceRate(dashboardNotificationInput.attendanceRecords);

  if (dashboardRole === 'admin' || dashboardRole === 'accountant') {
    if (unpaidCount > 0) {
      dashboardNotifications.push({
        id: 'unpaid-invoices',
        type: 'fee',
        title: t('notifications.unpaidInvoicesTitle', { count: unpaidCount }),
        desc: t('notifications.unpaidInvoicesDesc', { amount: formatCurrency ? formatCurrency(outstandingTotal) : formatMoney(outstandingTotal) }),
        time: t('notifications.timeNow'),
        urgent: outstandingTotal > 0,
      });
    }
  }

  if (dashboardRole === 'admin') {
    if (dashboardNotificationInput.inactiveStudents > 0) {
      dashboardNotifications.push({
        id: 'inactive-students',
        type: 'student',
        title: t('notifications.inactiveStudentsTitle', {
          count: dashboardNotificationInput.inactiveStudents,
        }),
        desc: t('notifications.inactiveStudentsDesc'),
        time: t('notifications.timeToday'),
        urgent: false,
      });
    }
  }

  if (attendanceRate !== null && attendanceRate < 75) {
    dashboardNotifications.push({
      id: 'low-attendance',
      type: 'attendance',
      title: t('notifications.lowAttendanceTitle'),
      desc: t('notifications.lowAttendanceDesc', { rate: attendanceRate }),
      time: t('notifications.timeToday'),
      urgent: attendanceRate < 60,
    });
  }

  if (dashboardRole === 'accountant' && unpaidCount === 0) {
    dashboardNotifications.push({
      id: 'fees-clear',
      type: 'fee',
      title: t('notifications.feesClearTitle'),
      desc: t('notifications.feesClearDesc'),
      time: t('notifications.timeToday'),
      urgent: false,
    });
  }

  return dashboardNotifications.slice(0, 8);
}
