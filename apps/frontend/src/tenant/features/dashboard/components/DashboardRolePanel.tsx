import React from 'react';
import { motion } from 'framer-motion';
import QuickActionsPanel from '@/tenant/features/dashboard/components/QuickActionsPanel';
import NotificationsPanel from '@/tenant/features/dashboard/components/NotificationsPanel';
import type { DashboardRole } from '@/lib/dashboardRole';
import type { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

interface DashboardRolePanelProps {
  dashboardRole: DashboardRole;
  notifications: ReturnType<typeof buildDashboardNotifications>;
}

/** Quick actions + notifications strip for the active dashboard layout role. */
export default function DashboardRolePanel({
  dashboardRole,
  notifications,
}: DashboardRolePanelProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section>
            <QuickActionsPanel dashboardRole={dashboardRole} />
          </Section>
        </div>
        <Section>
          <NotificationsPanel items={notifications} />
        </Section>
      </div>
    </div>
  );
}
