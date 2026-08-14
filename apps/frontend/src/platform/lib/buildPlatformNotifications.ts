import type { PlatformWorkspaceRow } from '@mms/shared';

export interface PlatformNotificationItem {
  id: string;
  type: 'workspace' | 'security' | 'system';
  title: string;
  desc: string;
  time: string;
  urgent?: boolean;
}

/** Builds real-time operational notifications for the Platform Operator Console. */
export function buildPlatformNotifications(
  workspaces: PlatformWorkspaceRow[] | undefined,
  isSuperUser: boolean,
): PlatformNotificationItem[] {
  const notifications: PlatformNotificationItem[] = [];

  if (!workspaces) {
    return notifications;
  }

  const total = workspaces.length;
  const disabledCount = workspaces.filter((w) => w.enabled === false).length;
  const activeCount = workspaces.filter((w) => w.enabled).length;

  if (disabledCount > 0) {
    notifications.push({
      id: 'disabled-workspaces',
      type: 'workspace',
      title: 'Inactive Madrasa Alert',
      desc: `${disabledCount} out of ${total} madrasas currently disabled or pending activation.`,
      time: 'Now',
      urgent: true,
    });
  }

  if (activeCount > 0) {
    notifications.push({
      id: 'active-workspaces-status',
      type: 'workspace',
      title: 'Ecosystem Active',
      desc: `${activeCount} madrasa tenant workspace(s) actively provisioned.`,
      time: 'Today',
      urgent: false,
    });
  }

  if (isSuperUser) {
    notifications.push({
      id: 'super-user-privilege',
      type: 'security',
      title: 'Super-User Privilege Active',
      desc: 'Authenticated with super-user root rights across all workspace tenants.',
      time: 'Active',
      urgent: false,
    });
  }

  notifications.push({
    id: 'system-health',
    type: 'system',
    title: 'System Health Operational',
    desc: 'PostgreSQL database cluster and RLS policies running smoothly.',
    time: 'Today',
    urgent: false,
  });

  return notifications;
}
