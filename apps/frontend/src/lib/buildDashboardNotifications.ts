import type { AppTranslationKey } from '@mms/shared';
import type { DashboardPersona } from '@/lib/dashboardPersona';
import type { Invoice } from '@/lib/data/financeData';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Student } from '@/lib/data/studentsData';

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
  return invoices.reduce((sum, inv) => {
    if (inv.status === 'cancelled' || inv.status === 'paid') return sum;
    if (inv.status === 'partial') {
      return sum + Math.max(0, Number(inv.finalAmt || 0) - Number(inv.paidAmt || 0));
    }
    return sum + Number(inv.finalAmt || 0);
  }, 0);
}

function countOpenInvoices(invoices: Invoice[]): number {
  return invoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial',
  ).length;
}

function todayAttendanceRate(records: AttendanceRecord[]): number | null {
  const today = new Date().toISOString().slice(0, 10);
  let dayRecords = records.filter((r) => r.date === today);
  if (dayRecords.length === 0) {
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
    if (dates.length === 0) return null;
    dayRecords = records.filter((r) => r.date === dates[0]);
  }
  if (dayRecords.length === 0) return null;
  const present = dayRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  return Math.round((present / dayRecords.length) * 100);
}

export function buildDashboardNotifications(
  persona: DashboardPersona,
  data: {
    invoices: Invoice[];
    attendanceRecords: AttendanceRecord[];
    students: Student[];
  },
  t: Translate,
): DashboardNotificationItem[] {
  const items: DashboardNotificationItem[] = [];
  const unpaidCount = countOpenInvoices(data.invoices);
  const outstandingTotal = sumOutstanding(data.invoices);
  const attRate = todayAttendanceRate(data.attendanceRecords);

  if (persona === 'admin' || persona === 'accountant') {
    if (unpaidCount > 0) {
      items.push({
        id: 'unpaid-invoices',
        type: 'fee',
        title: t('notifications.unpaidInvoicesTitle', { count: unpaidCount }),
        desc: t('notifications.unpaidInvoicesDesc', { amount: outstandingTotal.toLocaleString() }),
        time: t('notifications.timeNow'),
        urgent: outstandingTotal > 0,
      });
    }
  }

  if (persona === 'admin') {
    const inactiveStudents = data.students.filter((s) => s.status === 'inactive').length;
    if (inactiveStudents > 0) {
      items.push({
        id: 'inactive-students',
        type: 'student',
        title: t('notifications.inactiveStudentsTitle', { count: inactiveStudents }),
        desc: t('notifications.inactiveStudentsDesc'),
        time: t('notifications.timeToday'),
        urgent: false,
      });
    }
  }

  if (attRate !== null && attRate < 75) {
    items.push({
      id: 'low-attendance',
      type: 'attendance',
      title: t('notifications.lowAttendanceTitle'),
      desc: t('notifications.lowAttendanceDesc', { rate: attRate }),
      time: t('notifications.timeToday'),
      urgent: attRate < 60,
    });
  }

  if (persona === 'accountant' && unpaidCount === 0) {
    items.push({
      id: 'fees-clear',
      type: 'fee',
      title: t('notifications.feesClearTitle'),
      desc: t('notifications.feesClearDesc'),
      time: t('notifications.timeToday'),
      urgent: false,
    });
  }

  return items.slice(0, 8);
}
