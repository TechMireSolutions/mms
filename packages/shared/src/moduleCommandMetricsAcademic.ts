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

export interface QuestionBankCommandMetricsSnapshot {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  totalTests: number;
  totalResults: number;
  categories: number;
}
