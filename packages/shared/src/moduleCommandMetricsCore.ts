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
  let count = 0;
  for (let i = 0; i < records.length; i++) {
    if (getStatus(records[i]) === status) count++;
  }
  return count;
}

export function countRecordsSinceDate<T>(
  records: T[],
  getDate: (record: T) => string | undefined,
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffTime = cutoff.getTime();
  let count = 0;
  for (let i = 0; i < records.length; i++) {
    const raw = getDate(records[i]);
    if (!raw) continue;
    const time = new Date(raw).getTime();
    if (!Number.isNaN(time) && time >= cutoffTime) {
      count++;
    }
  }
  return count;
}

export function computeStudentsCommandMetrics(
  students: RegisteredRecord[],
  periodDays: number = MODULE_METRICS_DEFAULT_PERIOD_DAYS,
): StudentsCommandMetricsSnapshot {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffTime = cutoff.getTime();

  let active = 0;
  let inactive = 0;
  let suspended = 0;
  let newThisPeriod = 0;

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    if (s.status === 'active') active++;
    else if (s.status === 'inactive') inactive++;
    else if (s.status === 'suspended') suspended++;

    const raw = s.registeredDate ?? s.createdAt;
    if (raw) {
      const time = new Date(raw).getTime();
      if (!Number.isNaN(time) && time >= cutoffTime) {
        newThisPeriod++;
      }
    }
  }

  return {
    total: students.length,
    active,
    inactive,
    suspended,
    newThisPeriod,
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
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffTime = cutoff.getTime();

  let active = 0;
  let inactive = 0;
  let onLeave = 0;
  let other = 0;
  let newThisPeriod = 0;

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const status = t.status;
    if (status === activeStatus) active++;
    else if (status === inactiveStatus) inactive++;
    else if (status === onLeaveStatus) onLeave++;

    const trimmed = String(status ?? '').trim();
    if (trimmed.length > 0 && !knownStatuses.has(trimmed)) {
      other++;
    }

    const raw = t.joinDate ?? t.createdAt;
    if (raw) {
      const time = new Date(raw).getTime();
      if (!Number.isNaN(time) && time >= cutoffTime) {
        newThisPeriod++;
      }
    }
  }

  return {
    total: teachers.length,
    active,
    inactive,
    onLeave,
    other,
    newThisPeriod,
  };
}

export function computeUsersCommandMetrics(
  users: WorkspaceUserMetricRecord[],
): UsersCommandMetricsSnapshot {
  let active = 0;
  let suspended = 0;
  let admins = 0;
  let twoFaEnabled = 0;
  let activeSessions = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.status === 'active') active++;
    else if (user.status === 'suspended') suspended++;

    if (user.role === 'admin') admins++;
    if (user.twoFactorEnabled) twoFaEnabled++;
    if (user.activeSessions) activeSessions += user.activeSessions;
  }

  return {
    total: users.length,
    active,
    suspended,
    admins,
    twoFaEnabled,
    activeSessions,
  };
}
