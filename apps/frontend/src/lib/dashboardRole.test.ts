import { describe, expect, it } from 'vitest';
import {
  resolveDashboardWelcomeSubtitle,
  resolveDashboardRole,
  resolveDefaultDashboardWidgetScope,
  widgetMatchesDashboardRole,
  isDashboardAdminOrAccountant,
  isDashboardTeacher,
  isDashboardAdmin,
  isDashboardAccountant,
} from '@/lib/dashboardRole';

const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

const can = (granted: string[]) => (permission: string) => granted.includes(permission);

describe('resolveDashboardWelcomeSubtitle', () => {
  it('teacher with one session uses singular copy', () => {
    expect(resolveDashboardWelcomeSubtitle('teacher', { activeSessionsCount: 1, activeStudentCount: 0 }, t)).toBe(
      'dashboard.sessionsTodayOne',
    );
  });

  it('teacher with multiple sessions uses plural copy with count', () => {
    expect(resolveDashboardWelcomeSubtitle('teacher', { activeSessionsCount: 3, activeStudentCount: 0 }, t)).toBe(
      'dashboard.sessionsToday:{"count":3}',
    );
  });

  it('admin with active students uses overview copy', () => {
    expect(resolveDashboardWelcomeSubtitle('admin', { activeSessionsCount: 0, activeStudentCount: 5 }, t)).toBe(
      'dashboard.overviewActiveStudents:{"count":5}',
    );
  });

  it('accountant uses accountant copy', () => {
    expect(resolveDashboardWelcomeSubtitle('accountant', { activeSessionsCount: 0, activeStudentCount: 0 }, t)).toBe(
      'dashboard.accountantOverview',
    );
  });

  it('falls back to generic overview', () => {
    expect(resolveDashboardWelcomeSubtitle('admin', { activeSessionsCount: 0, activeStudentCount: 0 }, t)).toBe(
      'dashboard.overview',
    );
  });
});

describe('resolveDashboardRole', () => {
  it('returns admin when users write is granted', () => {
    expect(resolveDashboardRole(can(['users.manage']))).toBe('admin');
  });

  it('returns accountant when only finance write is granted', () => {
    expect(resolveDashboardRole(can(['finance.write']))).toBe('accountant');
  });

  it('returns teacher when attendance write is granted', () => {
    expect(resolveDashboardRole(can(['attendance.write']))).toBe('teacher');
  });

  it('defaults to teacher with no grants', () => {
    expect(resolveDashboardRole(can([]))).toBe('teacher');
  });
});

describe('resolveDefaultDashboardWidgetScope', () => {
  it('prefers students scope when students write is granted', () => {
    expect(resolveDefaultDashboardWidgetScope(can(['students.write']))).toEqual({
      collection: 'students',
      category: 'students',
    });
  });

  it('uses sessions scope when attendance write is granted', () => {
    expect(resolveDefaultDashboardWidgetScope(can(['attendance.write']))).toEqual({
      collection: 'sessions',
      category: 'sessions',
    });
  });

  it('falls back to finance scope', () => {
    expect(resolveDefaultDashboardWidgetScope(can([]))).toEqual({
      collection: 'finance_invoices',
      category: 'financial',
    });
  });
});

describe('widgetMatchesDashboardRole', () => {
  it('matches the role and defaults to admin', () => {
    expect(widgetMatchesDashboardRole('admin', 'admin')).toBe(true);
    expect(widgetMatchesDashboardRole(undefined, 'admin')).toBe(true);
    expect(widgetMatchesDashboardRole('teacher', 'admin')).toBe(false);
  });
});

describe('role capability helpers', () => {
  it('isDashboardAdminOrAccountant', () => {
    expect(isDashboardAdminOrAccountant('admin')).toBe(true);
    expect(isDashboardAdminOrAccountant('accountant')).toBe(true);
    expect(isDashboardAdminOrAccountant('teacher')).toBe(false);
  });

  it('isDashboardTeacher / isDashboardAdmin / isDashboardAccountant', () => {
    expect(isDashboardTeacher('teacher')).toBe(true);
    expect(isDashboardAdmin('admin')).toBe(true);
    expect(isDashboardAccountant('accountant')).toBe(true);
  });
});
