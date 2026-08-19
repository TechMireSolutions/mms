import React, { lazy, Suspense, useMemo } from 'react';
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
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
} from '@/components/ui/DetailDrawerArchiveChrome';
import { Button } from '@/components/ui/button';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { UserDetailModalRow, UserDetailModalSection } from '@/tenant/features/users/components/UserDetailModalLayout';

const MessageComposer = lazy(() => import('@/components/ui/MessageComposer'));

export interface UserDetailProps {
  user: SystemUser;
  onClose: () => void;
  onEdit?: (user: SystemUser) => void;
  canDelete?: boolean;
  onRestore?: (userId: string) => void | Promise<void>;
}

export const UserDetail = React.memo(function UserDetail({
  user,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: UserDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();
  const visibleModules = filterRbacModulesForSettings(globalSettings.enabledModules);
  const [messagingTarget, setMessagingTarget] = React.useState<{
    channel: 'sms' | 'whatsapp' | 'email';
    recipients: Array<{ id: string; name: string; phone: string; email: string }>;
  } | null>(null);

  const isArchived = Boolean(user.deletedAt);
  const canMutate = !isArchived;

  const workspaceRole = resolveWorkspaceRole(user.role, workspaceRoles);
  const effectivePerms: Record<string, PermissionAction[]> = workspaceRole?.permissions ?? {};

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

  const recipient = useMemo(
    () => [{
      id: user.id,
      name: user.name,
      phone: user.phone || '',
      email: user.email,
    }],
    [user],
  );

  const headerActionsNode = useMemo(
    () => (
      <DetailDrawerRestoreOrEditAction
        isArchived={isArchived}
        canRestore={canDelete}
        canEdit={Boolean(onEdit)}
        restoreLabel={t('users.trash.restore')}
        editLabel={t('users.edit')}
        onRestore={onRestore ? () => onRestore(String(user.id)) : undefined}
        onEdit={onEdit ? () => onEdit(user) : undefined}
      />
    ),
    [isArchived, canDelete, onEdit, t, onRestore, user],
  );

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title={user.name}
        subtitle={isArchived ? t('users.detail.archivedSubtitle') : user.email}
        icon={Shield}
        headerActions={headerActionsNode}
      >
        {isArchived ? (
          <DetailDrawerArchivedBanner
            deletedAt={user.deletedAt}
            describe={(formattedDate) => t('users.detail.archivedBanner', { date: formattedDate })}
          />
        ) : null}

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
                canMutate ? (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span>{user.email}</span>
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-8 w-8 min-h-8 min-w-8 rounded-lg border-secondary/30 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/15 hover:border-secondary/40 transition-colors shadow-none"
                      onClick={() => setMessagingTarget({ channel: 'email', recipients: recipient })}
                      title={t('users.sendEmail')}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  user.email
                )
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
                canMutate && user.phone ? (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span>{user.phone}</span>
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-8 w-8 min-h-8 min-w-8 rounded-lg border-success/30 bg-success/5 text-success hover:text-success hover:bg-success/15 hover:border-success/40 transition-colors shadow-none"
                      onClick={() => setMessagingTarget({ channel: 'whatsapp', recipients: recipient })}
                      title={t('contacts.detail.call')}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-8 w-8 min-h-8 min-w-8 rounded-lg border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/15 hover:border-primary/40 transition-colors shadow-none"
                      onClick={() => setMessagingTarget({ channel: 'sms', recipients: recipient })}
                      title={t('users.sendSms')}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  user.phone || '—'
                )
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
      </DetailDrawerShell>

      {messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={() => setMessagingTarget(null)}
          />
        </Suspense>
      )}
    </>
  );
});
