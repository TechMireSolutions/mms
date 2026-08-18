import {
  type AppTranslationKey,
  type Permission,
  FINANCE_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
  DASHBOARD_LOW_ATTENDANCE_THRESHOLD,
  DASHBOARD_URGENT_ATTENDANCE_THRESHOLD,
} from '@mms/shared';
import {
  isDashboardAdmin,
  isDashboardAdminOrAccountant,
  isDashboardAccountant,
  type DashboardRole,
} from '@/lib/dashboardRole';

export type DashboardNotificationType = 'fee' | 'event' | 'student' | 'attendance';

export interface DashboardNotificationItem {
  id: string;
  type: DashboardNotificationType;
  title: string;
  desc: string;
  time: string;
  urgent?: boolean;
}

export const MAX_DASHBOARD_NOTIFICATIONS = 8;

type Translate = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

export interface DashboardNotificationMetrics {
  outstandingInvoiceCount: number;
  outstandingBalance: number;
  attendanceRate: number | null;
  inactiveStudents: number;
}

export interface DashboardThresholdConfig {
  lowAttendanceThreshold?: number;
  urgentAttendanceThreshold?: number;
}

export function buildDashboardNotifications(
  dashboardRole: DashboardRole,
  dashboardNotificationInput: DashboardNotificationMetrics,
  t: Translate,
  formatCurrency: (amount: number | string | null | undefined) => string,
  can?: (permission: Permission) => boolean,
  thresholds?: DashboardThresholdConfig,
): DashboardNotificationItem[] {
  const dashboardNotifications: DashboardNotificationItem[] = [];
  const unpaidCount = dashboardNotificationInput.outstandingInvoiceCount;
  const outstandingTotal = dashboardNotificationInput.outstandingBalance;
  const attendanceRate = dashboardNotificationInput.attendanceRate;

  const lowThreshold = thresholds?.lowAttendanceThreshold ?? DASHBOARD_LOW_ATTENDANCE_THRESHOLD;
  const urgentThreshold = thresholds?.urgentAttendanceThreshold ?? DASHBOARD_URGENT_ATTENDANCE_THRESHOLD;

  const canFinance = can ? can(FINANCE_MODULE_MANIFEST.permissions.write) : true;
  const canStudents = can ? can(STUDENTS_MODULE_MANIFEST.permissions.read) : true;
  const canAttendance = can
    ? can(ATTENDANCE_MODULE_MANIFEST.permissions.write) || can(ATTENDANCE_MODULE_MANIFEST.permissions.read)
    : true;

  if (isDashboardAdminOrAccountant(dashboardRole) && canFinance) {
    if (unpaidCount > 0) {
      dashboardNotifications.push({
        id: 'unpaid-invoices',
        type: 'fee',
        title: t('notifications.unpaidInvoicesTitle', { count: unpaidCount }),
        desc: t('notifications.unpaidInvoicesDesc', {
          amount: formatCurrency(outstandingTotal),
        }),
        time: t('notifications.timeNow'),
        urgent: outstandingTotal > 0,
      });
    }
  }

  if (isDashboardAdmin(dashboardRole) && canStudents) {
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
    attendanceRate < lowThreshold
  ) {
    dashboardNotifications.push({
      id: 'low-attendance',
      type: 'attendance',
      title: t('notifications.lowAttendanceTitle'),
      desc: t('notifications.lowAttendanceDesc', { rate: attendanceRate }),
      time: t('notifications.timeToday'),
      urgent: attendanceRate < urgentThreshold,
    });
  }

  if (isDashboardAccountant(dashboardRole) && canFinance && unpaidCount === 0) {
    dashboardNotifications.push({
      id: 'fees-clear',
      type: 'fee',
      title: t('notifications.feesClearTitle'),
      desc: t('notifications.feesClearDesc'),
      time: t('notifications.timeToday'),
      urgent: false,
    });
  }

  return dashboardNotifications.slice(0, MAX_DASHBOARD_NOTIFICATIONS);
}

