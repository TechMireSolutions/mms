import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import type { PlatformUserProfile } from '@mms/shared';

export interface PlatformAdminStatusBadgesProps {
  admin: PlatformUserProfile;
}

export function PlatformAdminStatusBadges({ admin }: PlatformAdminStatusBadgesProps): React.JSX.Element {
  const { t } = useTranslation();
  const isDisabled = Boolean(admin.disabledAt);

  return (
    <div className="flex flex-wrap gap-1.5">
      {isDisabled ? (
        <StatusBadge
          status="disabled"
          config={{
            disabled: {
              label: t('platform.adminDisabled'),
              cls: SEMANTIC_BADGE.destructive,
            },
          }}
          size="sm"
        />
      ) : null}
      <StatusBadge
        status={admin.role}
        config={{
          super_user: {
            label: t('platform.roleSuperUser'),
            cls: 'bg-primary/10 text-primary border-primary/20',
          },
          admin: { label: t('platform.roleAdmin'), cls: SEMANTIC_BADGE.muted },
        }}
        size="sm"
      />
    </div>
  );
}

export interface PlatformAdminPermissionsBadgesProps {
  admin: PlatformUserProfile;
}

export function PlatformAdminPermissionsBadges({ admin }: PlatformAdminPermissionsBadgesProps): React.JSX.Element {
  const { t } = useTranslation();

  if (admin.role !== 'admin') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const perms = admin.permissions;
  const hasAny =
    perms?.workspaces || perms?.onboard || perms?.settings || perms?.admins || perms?.system;

  if (!hasAny) {
    return <span className="text-xs text-muted-foreground">{t('platform.adminNoCapabilities')}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {perms?.workspaces ? (
        <StatusBadge
          status="workspaces"
          config={{
            workspaces: {
              label: t('platform.permWorkspaces'),
              cls: 'bg-primary/10 text-primary border-primary/20',
            },
          }}
          size="sm"
        />
      ) : null}
      {perms?.onboard ? (
        <StatusBadge
          status="onboard"
          config={{
            onboard: {
              label: t('platform.permOnboard'),
              cls: 'bg-primary/10 text-primary border-primary/20',
            },
          }}
          size="sm"
        />
      ) : null}
      {perms?.settings ? (
        <StatusBadge
          status="settings"
          config={{
            settings: {
              label: t('platform.permSettings'),
              cls: 'bg-primary/10 text-primary border-primary/20',
            },
          }}
          size="sm"
        />
      ) : null}
      {perms?.admins ? (
        <StatusBadge
          status="admins"
          config={{
            admins: {
              label: t('platform.permAdmins'),
              cls: 'bg-primary/10 text-primary border-primary/20',
            },
          }}
          size="sm"
        />
      ) : null}
      {perms?.system ? (
        <StatusBadge
          status="system"
          config={{
            system: {
              label: t('platform.permSystem'),
              cls: 'bg-primary/10 text-primary border-primary/20',
            },
          }}
          size="sm"
        />
      ) : null}
    </div>
  );
}
