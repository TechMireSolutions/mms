import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Lock, Phone, Mail, Send } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { UserDetailModalRow, UserDetailModalSection } from '@/tenant/features/users/components/UserDetailModalLayout';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

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
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  if (!user) return null;

  const workspaceRole = resolveWorkspaceRole(user.role, workspaceRoles);
  const effectivePerms: Record<string, PermissionAction[]> = workspaceRole?.permissions ?? {};

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  const recipient = [{
    id: user.id,
    name: user.name,
    phone: user.phone || '',
    email: user.email,
  }];

  return (
    <Modal open onClose={onClose} title={user.name} subtitle={user.email} icon={Shield} size="md">
      <div className="mb-4 flex items-center gap-2">
        <UserStatusBadge status={user.status} />
        <UserRoleBadge roleId={user.role} />
      </div>

      <div className="space-y-4">
        <UserDetailModalSection icon={Shield} title={t('users.detailBasic')}>
          <UserDetailModalRow label={t('users.fieldName')} value={user.name} />
          <UserDetailModalRow
            label={t('users.fieldContactEmail')}
            value={
              <div className="flex items-center gap-1.5 justify-end">
                <span>{user.email}</span>
                <Button
                  variant="ghost"
                  type="button"
                  size="icon"
                  className="rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-muted"
                  onClick={() => openComposer('email', recipient)}
                  title={t('users.sendEmail')}
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </div>
            }
          />
          <UserDetailModalRow
            label={t('users.fieldLoginEmail')}
            value={user.loginEmail?.trim() || user.email}
          />
          {user.loginEmail && user.loginEmail.toLowerCase() !== user.email.toLowerCase() ? (
            <p className="py-2 text-xs text-muted-foreground">{t('users.loginEmailNote')}</p>
          ) : null}
          <UserDetailModalRow
            label={t('users.fieldPhone')}
            value={
              <div className="flex items-center gap-1.5 justify-end">
                <span>{user.phone || '—'}</span>
                {user.phone && (
                  <>
                    <Button
                      variant="ghost"
                      type="button"
                      size="icon"
                      className="rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-muted"
                      onClick={() => openComposer('whatsapp', recipient)}
                      title={t('contacts.detail.call')}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      size="icon"
                      className="rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-muted"
                      onClick={() => openComposer('sms', recipient)}
                      title={t('users.sendSms')}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            }
          />
          <UserDetailModalRow label={t('users.detailMemberSince')} value={user.createdDate} />
          <UserDetailModalRow label={t('users.colLastLogin')} value={fmtDate(user.lastLogin)} />
          <UserDetailModalRow label={t('users.detailSessions')} value={user.activeSessions} />
        </UserDetailModalSection>

        <UserDetailModalSection icon={Shield} title={t('users.detailRole')}>
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
        </UserDetailModalSection>

        <UserDetailModalSection icon={Lock} title={t('users.detailPermissions')}>
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
        </UserDetailModalSection>

        <UserDetailModalSection icon={AlertTriangle} title={t('users.detailSecurity')}>
          <UserDetailModalRow
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
          <UserDetailModalRow label={t('users.detailFailedLogins')} value={user.failedLoginAttempts} />
        </UserDetailModalSection>
      </div>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </Modal>
  );
}
