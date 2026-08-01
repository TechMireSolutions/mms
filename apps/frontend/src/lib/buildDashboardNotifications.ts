import {
  type AppTranslationKey,
  type Permission,
  formatMoney,
  FINANCE_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
} from '@mms/shared';
import type { DashboardRole } from '@/lib/dashboardRole';

export interface DashboardNotificationItem {
  id: string;
  type: 'fee' | 'event' | 'student' | 'attendance' | string;
  title: string;
  desc: string;
  time: string;
  urgent?: boolean;
}

type Translate = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

/** Alert when attendance rate drops below this percent. */
export const DASHBOARD_LOW_ATTENDANCE_THRESHOLD = 75;
/** Mark low-attendance notification urgent below this percent. */
export const DASHBOARD_URGENT_ATTENDANCE_THRESHOLD = 60;

export interface DashboardNotificationMetrics {
  outstandingInvoiceCount: number;
  outstandingBalance: number;
  attendanceRate: number | null;
  inactiveStudents: number;
}

export function buildDashboardNotifications(
  dashboardRole: DashboardRole,
  dashboardNotificationInput: DashboardNotificationMetrics,
  t: Translate,
  formatCurrency?: (amount: number | string | null | undefined) => string,
  can?: (permission: Permission) => boolean,
): DashboardNotificationItem[] {
  const dashboardNotifications: DashboardNotificationItem[] = [];
  const unpaidCount = dashboardNotificationInput.outstandingInvoiceCount;
  const outstandingTotal = dashboardNotificationInput.outstandingBalance;
  const attendanceRate = dashboardNotificationInput.attendanceRate;

  const canFinance = can ? can(FINANCE_MODULE_MANIFEST.permissions.write) : true;
  const canStudents = can ? can(STUDENTS_MODULE_MANIFEST.permissions.read) : true;
  const canAttendance = can
    ? can(ATTENDANCE_MODULE_MANIFEST.permissions.write) || can(ATTENDANCE_MODULE_MANIFEST.permissions.read)
    : true;

  if ((dashboardRole === 'admin' || dashboardRole === 'accountant') && canFinance) {
    if (unpaidCount > 0) {
      dashboardNotifications.push({
        id: 'unpaid-invoices',
        type: 'fee',
        title: t('notifications.unpaidInvoicesTitle', { count: unpaidCount }),
        desc: t('notifications.unpaidInvoicesDesc', {
          amount: formatCurrency ? formatCurrency(outstandingTotal) : formatMoney(outstandingTotal),
        }),
        time: t('notifications.timeNow'),
        urgent: outstandingTotal > 0,
      });
    }
  }

  if (dashboardRole === 'admin' && canStudents) {
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

  if (
    canAttendance &&
    attendanceRate !== null &&
    attendanceRate < DASHBOARD_LOW_ATTENDANCE_THRESHOLD
  ) {
    dashboardNotifications.push({
      id: 'low-attendance',
      type: 'attendance',
      title: t('notifications.lowAttendanceTitle'),
      desc: t('notifications.lowAttendanceDesc', { rate: attendanceRate }),
      time: t('notifications.timeToday'),
      urgent: attendanceRate < DASHBOARD_URGENT_ATTENDANCE_THRESHOLD,
    });
  }

  if (dashboardRole === 'accountant' && canFinance && unpaidCount === 0) {
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
