import { isOpenInvoiceStatus } from './financeModuleManifest.js';

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
  newThisPeriod: number;
}

export interface FinanceCommandMetricsSnapshot {
  totalInvoices: number;
  outstanding: number;
  overdue: number;
  paid: number;
  partial: number;
  totalPayments: number;
}

type StatusRecord = { status?: string };
type RegisteredRecord = StatusRecord & { registeredDate?: string; createdAt?: string };
type JoinDateRecord = StatusRecord & { joinDate?: string; createdAt?: string };
type InvoiceRecord = { status?: string };
type PaymentRecord = { id?: string | number };

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

export function computeTeachersCommandMetrics(
  teachers: JoinDateRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): TeachersCommandMetricsSnapshot {
  return {
    total: teachers.length,
    active: countRecordsWithStatus(teachers, 'active'),
    inactive: countRecordsWithStatus(teachers, 'inactive'),
    onLeave: countRecordsWithStatus(teachers, 'on_leave'),
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
  return {
    totalInvoices: invoices.length,
    outstanding: invoices.filter((inv) => isOpenInvoiceStatus(inv.status)).length,
    overdue: countRecordsWithStatus(invoices, 'overdue'),
    paid: countRecordsWithStatus(invoices, 'paid'),
    partial: countRecordsWithStatus(invoices, 'partial'),
    totalPayments: payments.length,
  };
}
