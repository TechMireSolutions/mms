import React from 'react';
import { Mail } from 'lucide-react';
import { formatDate, type PlatformUserProfile } from '@mms/shared';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';

interface PlatformAdminCardsProps {
  admins: PlatformUserProfile[];
  onEditAccess: (admin: PlatformUserProfile) => void;
  onToggleStatus: (admin: PlatformUserProfile, mode: 'disable' | 'enable') => void;
  onDelete: (admin: PlatformUserProfile) => void;
}

export function PlatformAdminCards({
  admins,
  onEditAccess,
  onToggleStatus,
  onDelete,
}: PlatformAdminCardsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleDirectoryCards
      items={admins}
      selectedIds={[]}
      renderItem={(admin) => {
        const isDisabled = Boolean(admin.disabledAt);

        return (
          <DirectoryEntityCard
            key={admin.id}
            accentClassName={admin.role === 'super_user' ? 'bg-primary/80' : undefined}
            className="flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{admin.name}</p>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
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
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                <span className="min-w-0 truncate">{admin.email}</span>
              </div>
              {admin.role === 'admin' ? (
                <div className="flex flex-wrap gap-1.5">
                  {admin.permissions?.workspaces ? (
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
                  {admin.permissions?.onboard ? (
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
                  {admin.permissions?.settings ? (
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
                  {admin.permissions?.admins ? (
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
                  {admin.permissions?.system ? (
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
                  {!admin.permissions?.workspaces &&
                  !admin.permissions?.onboard &&
                  !admin.permissions?.settings &&
                  !admin.permissions?.admins &&
                  !admin.permissions?.system ? (
                    <span className="text-xs text-muted-foreground">{t('platform.adminNoCapabilities')}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 mt-3">
              {admin.createdAt ? (
                <p className="text-xs text-muted-foreground/60 font-semibold">
                  {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
                </p>
              ) : (
                <span />
              )}
              {admin.role === 'admin' ? (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 rounded-xl font-bold flex-1 sm:flex-initial"
                    onClick={() => onEditAccess(admin)}
                  >
                    {t('platform.editAdminAccess')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 rounded-xl font-bold flex-1 sm:flex-initial"
                    onClick={() => onToggleStatus(admin, isDisabled ? 'enable' : 'disable')}
                  >
                    {t(isDisabled ? 'platform.enableAdmin' : 'platform.disableAdmin')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="min-h-11 rounded-xl font-bold flex-1 sm:flex-initial"
                    onClick={() => onDelete(admin)}
                  >
                    {t('platform.deleteAdmin')}
                  </Button>
                </div>
              ) : null}
            </div>
          </DirectoryEntityCard>
        );
      }}
    />
  );
}
