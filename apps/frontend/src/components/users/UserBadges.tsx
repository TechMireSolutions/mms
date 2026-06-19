import React from 'react';
import {
  activityActionMeta,
  resolveWorkspaceRole,
  userStatusMeta,
  workspaceRoleLabel,
  type ActivityAction,
  type UserStatus,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';

export function UserRoleBadge({ roleId }: { roleId: string }): React.JSX.Element {
  const { t } = useTranslation();
  const roles = useWorkspaceRoles();
  const role = resolveWorkspaceRole(roleId, roles);
  if (!role) {
    return <span className="text-xs text-muted-foreground">{roleId}</span>;
  }
  return <SettingsMetaBadge variant={role.badgeVariant}>{workspaceRoleLabel(role, t)}</SettingsMetaBadge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }): React.JSX.Element {
  const { t } = useTranslation();
  const meta = userStatusMeta(status);
  if (!meta) {
    return <SettingsMetaBadge variant="muted">{status}</SettingsMetaBadge>;
  }
  return <SettingsMetaBadge variant={meta.badgeVariant}>{t(meta.labelKey)}</SettingsMetaBadge>;
}

export function ActivityActionBadge({ action }: { action: ActivityAction }): React.JSX.Element {
  const { t } = useTranslation();
  const meta = activityActionMeta(action);
  if (!meta) {
    return <SettingsMetaBadge variant="muted">{action}</SettingsMetaBadge>;
  }
  return <SettingsMetaBadge variant={meta.badgeVariant}>{t(meta.labelKey)}</SettingsMetaBadge>;
}
