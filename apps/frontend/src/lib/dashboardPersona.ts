import type { Permission } from '@mms/shared';

export type DashboardPersona = 'admin' | 'teacher' | 'accountant';

/** Resolve dashboard layout persona from RBAC — replaces inline `role ===` checks. */
export function resolveDashboardPersona(can: (permission: Permission) => boolean): DashboardPersona {
  if (can('users.manage')) return 'admin';
  if (can('finance.write') && !can('attendance.write')) return 'accountant';
  if (can('attendance.write')) return 'teacher';
  if (can('finance.write')) return 'accountant';
  return 'admin';
}

/** Whether a widget/card tagged for a persona should render for the active viewer. */
export function widgetMatchesPersona(
  widgetRole: string | undefined,
  persona: DashboardPersona,
): boolean {
  return (widgetRole ?? 'admin') === persona;
}
