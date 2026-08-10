import { isOpenInvoiceStatus } from './financeModuleManifest.js';
import { resolveTeacherStatusRoles, TEACHER_STATUS_VALUES } from './teacherTypes.js';

/** Default rolling window for "new records" command-centre metrics (globle1 §2.1). */
export const MODULE_METRICS_DEFAULT_PERIOD_DAYS = 30;

export interface StudentsCommandMetricsSnapshot {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  newThisPeriod: number;
}

export interface TeachersCommandMetricsSnapshot {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  /** Active rows whose status is outside {@link TEACHER_STATUS_VALUES}. */
  other: number;
  newThisPeriod: number;
}

export interface FinanceCommandMetricsSnapshot {
  totalInvoices: number;
  outstanding: number;
  overdue: number;
  paid: number;
  partial: number;
  totalPayments: number;
  collectedTotal: number;
  outstandingBalance: number;
  discountTotal: number;
  collectedThisMonth: number;
  collectedPrevMonth: number;
  outstandingThisMonth: number;
  outstandingPrevMonth: number;
}

export interface UsersCommandMetricsSnapshot {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  twoFaEnabled: number;
  activeSessions: number;
}

type StatusRecord = { status?: string };
type RegisteredRecord = StatusRecord & { registeredDate?: string; createdAt?: string };
type JoinDateRecord = StatusRecord & { joinDate?: string; createdAt?: string };
type InvoiceRecord = {
  status?: string;
  finalAmt?: number;
  paidAmt?: number;
  paidDate?: string;
  dueDate?: string;
  discountAmt?: number;
};
type PaymentRecord = { id?: string | number };
type WorkspaceUserMetricRecord = StatusRecord & {
  role?: string;
  twoFactorEnabled?: boolean;
  activeSessions?: number;
};

export function countRecordsWithStatus<T>(
  records: T[],
  status: string,
  getStatus: (record: T) => string | undefined = (record) =>
    (record as StatusRecord).status,
): number {
  return records.filter((record) => getStatus(record) === status).length;
}

export function countRecordsSinceDate<T>(
  records: T[],
  getDate: (record: T) => string | undefined,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  return records.filter((record) => {
    const raw = getDate(record);
    if (!raw) return false;
    const parsed = new Date(raw);
    return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
  }).length;
}

export function computeStudentsCommandMetrics(
  students: RegisteredRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): StudentsCommandMetricsSnapshot {
  return {
    total: students.length,
    active: countRecordsWithStatus(students, 'active'),
    inactive: countRecordsWithStatus(students, 'inactive'),
    suspended: countRecordsWithStatus(students, 'suspended'),
    newThisPeriod: countRecordsSinceDate(
      students,
      (s) => s.registeredDate ?? s.createdAt,
      periodDays,
    ),
  };
}

/**
 * @deprecated Prefer SQL `aggregateTeachersCommandMetrics` / `loadTeachersCommandMetrics`.
 * Kept for pure unit tests of status / joinDate period predicates.
 */
export function computeTeachersCommandMetrics(
  teachers: JoinDateRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): TeachersCommandMetricsSnapshot {
  const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } =
    resolveTeacherStatusRoles();
  const knownStatuses = new Set<string>(TEACHER_STATUS_VALUES);
  return {
    total: teachers.length,
    active: countRecordsWithStatus(teachers, activeStatus),
    inactive: countRecordsWithStatus(teachers, inactiveStatus),
    onLeave: countRecordsWithStatus(teachers, onLeaveStatus),
    other: teachers.filter((teacher) => {
      const status = String(teacher.status ?? '').trim();
      return status.length > 0 && !knownStatuses.has(status);
    }).length,
    newThisPeriod: countRecordsSinceDate(
      teachers,
      (t) => t.joinDate ?? t.createdAt,
      periodDays,
    ),
  };
}

export function computeFinanceCommandMetrics(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
): FinanceCommandMetricsSnapshot {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const prev = new Date(thisYear, thisMonth - 1, 1);
  const prevYear = prev.getFullYear();
  const prevMonth = prev.getMonth();

  const collectedForInvoice = (invoice: InvoiceRecord): number => {
    if (invoice.status === 'paid') return invoice.finalAmt ?? 0;
    if (invoice.status === 'partial') {
      return invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round((invoice.finalAmt ?? 0) / 2);
    }
    return 0;
  };
  const outstandingForInvoice = (invoice: InvoiceRecord): number => {
    if (invoice.status === 'cancelled' || invoice.status === 'paid') return 0;
    if (invoice.status === 'partial') {
      const paid = invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round((invoice.finalAmt ?? 0) / 2);
      return Math.max(0, (invoice.finalAmt ?? 0) - paid);
    }
    return invoice.finalAmt ?? 0;
  };
  const inMonth = (dateStr: string | undefined, year: number, month: number): boolean => {
    if (!dateStr) return false;
    return Number(dateStr.slice(0, 4)) === year && Number(dateStr.slice(5, 7)) - 1 === month;
  };

  let collectedTotal = 0;
  let outstandingBalance = 0;
  let discountTotal = 0;
  let collectedThisMonth = 0;
  let collectedPrevMonth = 0;
  let outstandingThisMonth = 0;
  let outstandingPrevMonth = 0;

  for (const invoice of invoices) {
    if (invoice.status === 'cancelled') continue;
    const collected = collectedForInvoice(invoice);
    const outstanding = outstandingForInvoice(invoice);
    collectedTotal += collected;
    outstandingBalance += outstanding;
    discountTotal += invoice.discountAmt ?? 0;

    const collectDate = invoice.paidDate || invoice.dueDate;
    if (inMonth(collectDate, thisYear, thisMonth)) collectedThisMonth += collected;
    if (inMonth(collectDate, prevYear, prevMonth)) collectedPrevMonth += collected;
    if (inMonth(invoice.dueDate, thisYear, thisMonth)) outstandingThisMonth += outstanding;
    if (inMonth(invoice.dueDate, prevYear, prevMonth)) outstandingPrevMonth += outstanding;
  }

  return {
    totalInvoices: invoices.length,
    outstanding: invoices.filter((inv) => isOpenInvoiceStatus(inv.status)).length,
    overdue: countRecordsWithStatus(invoices, 'overdue'),
    paid: countRecordsWithStatus(invoices, 'paid'),
    partial: countRecordsWithStatus(invoices, 'partial'),
    totalPayments: payments.length,
    collectedTotal,
    outstandingBalance,
    discountTotal,
    collectedThisMonth,
    collectedPrevMonth,
    outstandingThisMonth,
    outstandingPrevMonth,
  };
}

export function computeUsersCommandMetrics(
  users: WorkspaceUserMetricRecord[],
): UsersCommandMetricsSnapshot {
  return {
    total: users.length,
    active: countRecordsWithStatus(users, 'active'),
    suspended: countRecordsWithStatus(users, 'suspended'),
    admins: users.filter((user) => user.role === 'admin').length,
    twoFaEnabled: users.filter((user) => Boolean(user.twoFactorEnabled)).length,
    activeSessions: users.reduce((sum, user) => sum + (user.activeSessions ?? 0), 0),
  };
}
