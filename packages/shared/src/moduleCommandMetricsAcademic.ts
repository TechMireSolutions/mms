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
  totalClasses: number;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
}

type SessionClassMetric = { enrolled?: number; capacity?: number };
type SessionMetricRecord = StatusRecord & {
  classes?: SessionClassMetric[];
  startDate?: string;
  createdAt?: string;
};

function countSessionsInDayWindow(
  sessions: SessionMetricRecord[],
  daysStart: number,
  daysEnd: number,
): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysStart);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - daysEnd);
  return sessions.filter((session) => {
    const raw = session.startDate ?? session.createdAt;
    if (!raw) return false;
    const parsed = new Date(raw);
    return !Number.isNaN(parsed.getTime()) && parsed >= start && parsed <= end;
  }).length;
}

export function computeSessionsCommandMetrics(
  sessions: SessionMetricRecord[],
): SessionsCommandMetricsSnapshot {
  let totalEnrolled = 0;
  let totalCapacity = 0;
  let totalClasses = 0;
  for (const session of sessions) {
    const classes = session.classes ?? [];
    totalClasses += classes.length;
    for (const cls of classes) {
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
    totalClasses,
    sessionsThisWeek: countSessionsInDayWindow(sessions, 6, 0),
    sessionsLastWeek: countSessionsInDayWindow(sessions, 13, 7),
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
  selectedDatePresentRate: number;
  priorDatePresentRate: number;
  overallPresentRate: number;
}

type AttendanceMetricRecord = StatusRecord & { date?: string };

function presentRateForRecords(records: AttendanceMetricRecord[]): number {
  if (records.length === 0) return 0;
  const present = records.filter(
    (record) => record.status === 'present' || record.status === 'late',
  ).length;
  return Math.round((present / records.length) * 100);
}

export function computeAttendanceCommandMetrics(
  records: AttendanceMetricRecord[],
  options?: { selectedDate?: string; periodDays?: number },
): AttendanceCommandMetricsSnapshot {
  const selectedDate = options?.selectedDate ?? new Date().toISOString().slice(0, 10);
  const periodDays = options?.periodDays ?? MODULE_METRICS_DEFAULT_PERIOD_DAYS;
  const selectedDateRecords = records.filter((record) => record.date === selectedDate);
  const sortedDates = [...new Set(records.map((record) => record.date).filter(Boolean) as string[])].sort();
  const priorDate = [...sortedDates].reverse().find((date) => date < selectedDate)
    ?? sortedDates.filter((date) => date !== selectedDate).at(-1);
  const priorDateRecords = priorDate ? records.filter((record) => record.date === priorDate) : [];
  return {
    total: records.length,
    selectedDatePresent: countRecordsWithStatus(selectedDateRecords, 'present'),
    selectedDateAbsent: countRecordsWithStatus(selectedDateRecords, 'absent'),
    selectedDateLate: countRecordsWithStatus(selectedDateRecords, 'late'),
    selectedDateExcused: countRecordsWithStatus(selectedDateRecords, 'excused'),
    periodTotal: countRecordsSinceDate(records, (record) => record.date, periodDays),
    selectedDatePresentRate: presentRateForRecords(selectedDateRecords),
    priorDatePresentRate: presentRateForRecords(priorDateRecords),
    overallPresentRate: presentRateForRecords(records),
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
  passRate: number;
}

type ExamResultMetricRecord = { examId?: string; marksObtained?: number };
type ExamMetricRecord = StatusRecord & { id?: string; passingMarks?: number };

export function computeExaminationsCommandMetrics(
  exams: ExamMetricRecord[],
  results: ExamResultMetricRecord[],
): ExaminationsCommandMetricsSnapshot {
  const examIdsWithResults = new Set(
    results.map((record) => record.examId).filter(Boolean),
  );
  const passingByExamId = new Map(
    exams.map((exam) => [exam.id, exam.passingMarks ?? 0] as const),
  );
  let passed = 0;
  let scored = 0;
  for (const result of results) {
    if (!result.examId || typeof result.marksObtained !== 'number') continue;
    const passingMarks = passingByExamId.get(result.examId);
    if (passingMarks === undefined) continue;
    scored += 1;
    if (result.marksObtained >= passingMarks) passed += 1;
  }
  return {
    total: exams.length,
    upcoming: countRecordsWithStatus(exams, 'upcoming'),
    ongoing: countRecordsWithStatus(exams, 'ongoing'),
    completed: countRecordsWithStatus(exams, 'completed'),
    scheduled: countRecordsWithStatus(exams, 'scheduled'),
    cancelled: countRecordsWithStatus(exams, 'cancelled'),
    totalResults: results.length,
    examsWithResults: examIdsWithResults.size,
    passRate: scored > 0 ? Math.round((passed / scored) * 100) : 0,
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
