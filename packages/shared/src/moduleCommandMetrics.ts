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
  const outstandingStatuses = new Set(['pending', 'overdue', 'partial']);
  return {
    totalInvoices: invoices.length,
    outstanding: invoices.filter((inv) => outstandingStatuses.has(inv.status ?? '')).length,
    overdue: countRecordsWithStatus(invoices, 'overdue'),
    paid: countRecordsWithStatus(invoices, 'paid'),
    partial: countRecordsWithStatus(invoices, 'partial'),
    totalPayments: payments.length,
  };
}

export interface SessionsCommandMetricsSnapshot {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  totalEnrolled: number;
  totalCapacity: number;
}

type SessionClassMetric = { enrolled?: number; capacity?: number };
type SessionMetricRecord = StatusRecord & { classes?: SessionClassMetric[] };

export function computeSessionsCommandMetrics(
  sessions: SessionMetricRecord[],
): SessionsCommandMetricsSnapshot {
  let totalEnrolled = 0;
  let totalCapacity = 0;
  for (const session of sessions) {
    for (const cls of session.classes ?? []) {
      totalEnrolled += cls.enrolled ?? 0;
      totalCapacity += cls.capacity ?? 0;
    }
  }
  return {
    total: sessions.length,
    active: countRecordsWithStatus(sessions, 'active'),
    upcoming: countRecordsWithStatus(sessions, 'upcoming'),
    completed: countRecordsWithStatus(sessions, 'completed'),
    cancelled: countRecordsWithStatus(sessions, 'cancelled'),
    totalEnrolled,
    totalCapacity,
  };
}

export interface EnrollmentsCommandMetricsSnapshot {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  revenue: number;
  newThisPeriod: number;
}

export interface ObligationsCommandMetricsSnapshot {
  total: number;
  totalAmount: number;
  cash: number;
  online: number;
  newThisPeriod: number;
  obligationTypes: number;
}

export interface AccountingCommandMetricsSnapshot {
  totalEntries: number;
  posted: number;
  draft: number;
  activeAccounts: number;
  inactiveAccounts: number;
  newThisPeriod: number;
  postedVolume: number;
}

export interface HasanatCommandMetricsSnapshot {
  totalStock: number;
  available: number;
  distributed: number;
  redeemed: number;
  active: number;
  returned: number;
  denominations: number;
}

type EnrollmentMetricRecord = StatusRecord & { finalFee?: number; enrolledDate?: string };

export function computeEnrollmentsCommandMetrics(
  enrollments: EnrollmentMetricRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): EnrollmentsCommandMetricsSnapshot {
  const revenue = enrollments
    .filter((record) => record.status !== 'cancelled')
    .reduce((sum, record) => sum + (record.finalFee ?? 0), 0);
  return {
    total: enrollments.length,
    confirmed: countRecordsWithStatus(enrollments, 'confirmed'),
    pending: countRecordsWithStatus(enrollments, 'pending'),
    cancelled: countRecordsWithStatus(enrollments, 'cancelled'),
    completed: countRecordsWithStatus(enrollments, 'completed'),
    revenue,
    newThisPeriod: countRecordsSinceDate(enrollments, (record) => record.enrolledDate, periodDays),
  };
}

type ObligationCollectionMetricRecord = {
  amount?: number;
  payment_mode?: string;
  received_date?: string;
};

export function computeObligationsCommandMetrics(
  collections: ObligationCollectionMetricRecord[],
  obligationTypesCount: number,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): ObligationsCommandMetricsSnapshot {
  const totalAmount = collections.reduce((sum, record) => sum + (record.amount ?? 0), 0);
  return {
    total: collections.length,
    totalAmount,
    cash: collections.filter((record) => record.payment_mode === 'Cash').length,
    online: collections.filter((record) => record.payment_mode === 'Online').length,
    newThisPeriod: countRecordsSinceDate(collections, (record) => record.received_date, periodDays),
    obligationTypes: obligationTypesCount,
  };
}

type JournalLineMetric = { debit?: number; credit?: number };
type JournalEntryMetricRecord = StatusRecord & { date?: string; lines?: JournalLineMetric[] };
type AccountMetricRecord = { isActive?: boolean };

export function computeAccountingCommandMetrics(
  entries: JournalEntryMetricRecord[],
  accounts: AccountMetricRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): AccountingCommandMetricsSnapshot {
  const postedEntries = entries.filter((record) => record.status === 'posted');
  const postedVolume = postedEntries.reduce((sum, entry) => {
    const lineTotal = (entry.lines ?? []).reduce((lineSum, line) => lineSum + (line.debit ?? 0), 0);
    return sum + lineTotal;
  }, 0);
  const activeAccounts = accounts.filter((account) => account.isActive !== false).length;
  return {
    totalEntries: entries.length,
    posted: postedEntries.length,
    draft: countRecordsWithStatus(entries, 'draft'),
    activeAccounts,
    inactiveAccounts: accounts.length - activeAccounts,
    newThisPeriod: countRecordsSinceDate(entries, (record) => record.date, periodDays),
    postedVolume,
  };
}

type HasanatBatchMetricRecord = { quantity?: number; remaining?: number };
type HasanatDistributionMetricRecord = StatusRecord & { quantity?: number };
type HasanatDenomMetricRecord = { active?: boolean };

export function computeHasanatCommandMetrics(
  batches: HasanatBatchMetricRecord[],
  distributions: HasanatDistributionMetricRecord[],
  denoms: HasanatDenomMetricRecord[],
): HasanatCommandMetricsSnapshot {
  const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity ?? 0), 0);
  const available = batches.reduce((sum, batch) => sum + (batch.remaining ?? 0), 0);
  const distributed = distributions.reduce((sum, record) => sum + (record.quantity ?? 0), 0);
  const sumByStatus = (status: string) =>
    distributions
      .filter((record) => record.status === status)
      .reduce((sum, record) => sum + (record.quantity ?? 0), 0);
  return {
    totalStock,
    available,
    distributed,
    redeemed: sumByStatus('redeemed'),
    active: sumByStatus('active'),
    returned: sumByStatus('returned'),
    denominations: denoms.filter((denom) => denom.active !== false).length,
  };
}

export interface AttendanceCommandMetricsSnapshot {
  total: number;
  selectedDatePresent: number;
  selectedDateAbsent: number;
  selectedDateLate: number;
  selectedDateExcused: number;
  periodTotal: number;
}

type AttendanceMetricRecord = StatusRecord & { date?: string };

export function computeAttendanceCommandMetrics(
  records: AttendanceMetricRecord[],
  options?: { selectedDate?: string; periodDays?: number },
): AttendanceCommandMetricsSnapshot {
  const selectedDate = options?.selectedDate ?? new Date().toISOString().slice(0, 10);
  const periodDays = options?.periodDays ?? MODULE_METRICS_DEFAULT_PERIOD_DAYS;
  const selectedDateRecords = records.filter((record) => record.date === selectedDate);
  return {
    total: records.length,
    selectedDatePresent: countRecordsWithStatus(selectedDateRecords, 'present'),
    selectedDateAbsent: countRecordsWithStatus(selectedDateRecords, 'absent'),
    selectedDateLate: countRecordsWithStatus(selectedDateRecords, 'late'),
    selectedDateExcused: countRecordsWithStatus(selectedDateRecords, 'excused'),
    periodTotal: countRecordsSinceDate(records, (record) => record.date, periodDays),
  };
}

export interface ExaminationsCommandMetricsSnapshot {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  totalResults: number;
  examsWithResults: number;
}

type ExamResultMetricRecord = { examId?: string };

export function computeExaminationsCommandMetrics(
  exams: StatusRecord[],
  results: ExamResultMetricRecord[],
): ExaminationsCommandMetricsSnapshot {
  const examIdsWithResults = new Set(
    results.map((record) => record.examId).filter(Boolean),
  );
  return {
    total: exams.length,
    upcoming: countRecordsWithStatus(exams, 'upcoming'),
    ongoing: countRecordsWithStatus(exams, 'ongoing'),
    completed: countRecordsWithStatus(exams, 'completed'),
    scheduled: countRecordsWithStatus(exams, 'scheduled'),
    cancelled: countRecordsWithStatus(exams, 'cancelled'),
    totalResults: results.length,
    examsWithResults: examIdsWithResults.size,
  };
}

export interface QuestionBankCommandMetricsSnapshot {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  totalTests: number;
  totalResults: number;
  categories: number;
}

type QuestionMetricRecord = { difficulty?: string };

export function computeQuestionBankCommandMetrics(
  questions: QuestionMetricRecord[],
  tests: unknown[],
  results: unknown[],
  categoryCount: number,
): QuestionBankCommandMetricsSnapshot {
  return {
    total: questions.length,
    easy: countRecordsWithStatus(questions, 'easy', (q) => q.difficulty),
    medium: countRecordsWithStatus(questions, 'medium', (q) => q.difficulty),
    hard: countRecordsWithStatus(questions, 'hard', (q) => q.difficulty),
    totalTests: tests.length,
    totalResults: results.length,
    categories: categoryCount,
  };
}
