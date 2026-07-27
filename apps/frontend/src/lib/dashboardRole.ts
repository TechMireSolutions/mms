import {
  ATTENDANCE_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  DASHBOARD_MODULE_MANIFEST,
  type Permission,
} from '@mms/shared';

export type DashboardRole = 'admin' | 'teacher' | 'accountant';

/** Resolve dashboard layout role from RBAC without inline `role ===` checks. */
export function resolveDashboardRole(can: (permission: Permission) => boolean): DashboardRole {
  if (
    can(USERS_MODULE_MANIFEST.permissions.write) ||
    can(DASHBOARD_MODULE_MANIFEST.permissions.setupWrite)
  ) {
    return 'admin';
  }
  if (can(FINANCE_MODULE_MANIFEST.permissions.write) && !can(ATTENDANCE_MODULE_MANIFEST.permissions.write)) {
    return 'accountant';
  }
  if (can(ATTENDANCE_MODULE_MANIFEST.permissions.write)) return 'teacher';
  if (can(FINANCE_MODULE_MANIFEST.permissions.write)) return 'accountant';
  // Least-privilege layout among existing role buckets (not admin).
  return 'teacher';
}

/** Whether a widget/card tagged for a role should render for the active viewer. */
export function widgetMatchesDashboardRole(
  widgetRole: string | undefined,
  dashboardRole: DashboardRole,
): boolean {
  return (widgetRole ?? 'admin') === dashboardRole;
}
