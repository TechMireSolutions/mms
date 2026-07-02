import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import {
  filterRbacModulesForSettings,
  resolveWorkspaceRole,
  workspaceRoleDescription,
  type PermissionAction,
  type SystemUser,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { formatDate } from '@mms/shared';
import { Modal } from '@/components/ui/Modal';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';

interface RowProps {
  label: string;
  value: React.ReactNode;
}

function Row({ label, value }: RowProps): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-semibold text-foreground">{value || '—'}</span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover/card:bg-primary" />
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2.5 pl-5.5">
        <Icon className="h-3.5 w-3.5 text-primary/70 group-hover/card:text-primary transition-colors" aria-hidden />
        <p className="text-[11px] font-black uppercase tracking-wider text-foreground m-0">{title}</p>
      </div>
      <div className="px-5 pb-1">{children}</div>
    </div>
  );
}

export interface UserDetailModalProps {
  user: SystemUser | null;
  onClose: () => void;
}

export function UserDetailModal({
  user,
  onClose,
}: UserDetailModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();
  const visibleModules = filterRbacModulesForSettings(globalSettings.enabledModules);

  if (!user) return null;

  const workspaceRole = resolveWorkspaceRole(user.role, workspaceRoles);
  const effectivePerms: Record<string, PermissionAction[]> = workspaceRole?.permissions ?? {};

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  return (
    <Modal open onClose={onClose} title={user.name} subtitle={user.email} icon={Shield} size="md">
      <div className="mb-4 flex items-center gap-2">
        <UserStatusBadge status={user.status} />
        <UserRoleBadge roleId={user.role} />
      </div>

      <div className="space-y-4">
        <Section icon={Shield} title={t('users.detailBasic')}>
          <Row label={t('users.fieldName')} value={user.name} />
          <Row label={t('users.fieldContactEmail')} value={user.email} />
          <Row
            label={t('users.fieldLoginEmail')}
            value={user.loginEmail?.trim() || user.email}
          />
          {user.loginEmail && user.loginEmail.toLowerCase() !== user.email.toLowerCase() ? (
            <p className="py-2 text-[11px] text-muted-foreground">{t('users.loginEmailNote')}</p>
          ) : null}
          <Row label={t('users.fieldPhone')} value={user.phone} />
          <Row label={t('users.detailMemberSince')} value={user.createdDate} />
          <Row label={t('users.colLastLogin')} value={fmtDate(user.lastLogin)} />
          <Row label={t('users.detailSessions')} value={user.activeSessions} />
        </Section>

        <Section icon={Shield} title={t('users.detailRole')}>
          <div className="py-3">
            {workspaceRole ? (
              <div className="space-y-2">
                <UserRoleBadge roleId={workspaceRole.id} />
                <p className="text-xs text-muted-foreground">{workspaceRoleDescription(workspaceRole, t)}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('users.detailNoRole')}</p>
            )}
          </div>
        </Section>

        <Section icon={Lock} title={t('users.detailPermissions')}>
          <div className="space-y-2 py-3">
            {visibleModules.map((mod) => {
              const perms = effectivePerms[mod.id] ?? [];
              if (perms.length === 0) return null;
              return (
                <div key={mod.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">{t(mod.labelKey)}</span>
                  {perms.map((action) => (
                    <SettingsMetaBadge key={`${mod.id}-${action}`} variant="muted">
                      {t(`users.permission.${action}`)}
                    </SettingsMetaBadge>
                  ))}
                </div>
              );
            })}
            {Object.keys(effectivePerms).length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('users.detailNoPermissions')}</p>
            ) : null}
          </div>
        </Section>

        <Section icon={AlertTriangle} title={t('users.detailSecurity')}>
          <Row
            label={t('users.col2fa')}
            value={
              user.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('users.twoFactorOn')}
                </span>
              ) : (
                t('users.twoFactorOff')
              )
            }
          />
          <Row label={t('users.detailFailedLogins')} value={user.failedLoginAttempts} />
        </Section>
      </div>
    </Modal>
  );
}
