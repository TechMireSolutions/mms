import type { Permission } from '@mms/shared';

export type DashboardRole = 'admin' | 'teacher' | 'accountant';

/** Resolve dashboard layout role from RBAC without inline `role ===` checks. */
export function resolveDashboardRole(can: (permission: Permission) => boolean): DashboardRole {
  if (can('users.manage')) return 'admin';
  if (can('finance.write') && !can('attendance.write')) return 'accountant';
  if (can('attendance.write')) return 'teacher';
  if (can('finance.write')) return 'accountant';
  return 'admin';
}

/** Whether a widget/card tagged for a role should render for the active viewer. */
export function widgetMatchesDashboardRole(
  widgetRole: string | undefined,
  dashboardRole: DashboardRole,
): boolean {
  return (widgetRole ?? 'admin') === dashboardRole;
}
