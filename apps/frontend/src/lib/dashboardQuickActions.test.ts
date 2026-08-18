import { describe, expect, it } from 'vitest';
import {
  getQuickActionsForRole,
} from './dashboardQuickActions';

describe('dashboardQuickActions', () => {
  it('returns quick actions configured for admin role', () => {
    const adminActions = getQuickActionsForRole('admin');
    expect(adminActions.length).toBeGreaterThan(0);
    expect(adminActions.every((action) => action.roles.includes('admin'))).toBe(true);
  });

  it('returns quick actions configured for accountant role', () => {
    const accountantActions = getQuickActionsForRole('accountant');
    expect(accountantActions.some((action) => action.id === 'record-payment')).toBe(true);
    expect(accountantActions.some((action) => action.id === 'print-receipt')).toBe(true);
  });

  it('returns quick actions configured for teacher role', () => {
    const teacherActions = getQuickActionsForRole('teacher');
    expect(teacherActions.some((action) => action.id === 'take-attendance')).toBe(true);
    expect(teacherActions.some((action) => action.id === 'print-receipt')).toBe(false);
  });
});
