import React from 'react';
import QuickActionsPanel from '@/tenant/features/dashboard/components/QuickActionsPanel';
import NotificationsPanel from '@/tenant/features/dashboard/components/NotificationsPanel';
import type { DashboardRole } from '@/lib/dashboardRole';
import type { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';

interface DashboardRolePanelProps {
  dashboardRole: DashboardRole;
  notifications: ReturnType<typeof buildDashboardNotifications>;
}

/** Quick actions + notifications strip for the active dashboard layout role. */
export function DashboardRolePanel({
  dashboardRole,
  notifications,
}: DashboardRolePanelProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <QuickActionsPanel dashboardRole={dashboardRole} />
      </div>
      <div>
        <NotificationsPanel items={notifications} />
      </div>
    </div>
  );
}

export default DashboardRolePanel;

