import { countRecordsSinceDate, countRecordsWithStatus, MODULE_METRICS_DEFAULT_PERIOD_DAYS } from './moduleCommandMetricsCore.js';

type StatusRecord = { status?: string };

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
