import React, { lazy, Suspense } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Lock, Phone, Mail, Send } from 'lucide-react';
import {
  filterRbacModulesForSettings,
  formatDate,
  resolveWorkspaceRole,
  workspaceRoleDescription,
  type PermissionAction,
  type SystemUser,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
} from '@/components/ui/DetailDrawerArchiveChrome';
import { Button } from '@/components/ui/button';
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import { useToast } from '@/components/ui/use-toast';
import { useUsersContractVerifyEmail } from '@/tenant/hooks/collections/users';

const MessageComposer = lazy(() => import('@/components/ui/MessageComposer'));

export interface UserDetailProps {
  user: SystemUser;
  onClose: () => void;
  onEdit?: (user: SystemUser) => void;
  canDelete?: boolean;
  onRestore?: (userId: string) => void | Promise<void>;
}

export const UserDetail = (function UserDetail({
  user,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: UserDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const globalSettings = useGlobalSettings();
  const workspaceRoles = useWorkspaceRoles();
  const verifyEmailMutation = useUsersContractVerifyEmail();

  const handleVerifyEmail = async () => {
    try {
      await verifyEmailMutation.mutateAsync({
        params: { id: String(user.id) },
        body: {},
      });
      toast({
        title: t('users.emailVerifiedSuccess'),
      });
    } catch {
      toast({
        title: t('errors.state.generic'),
        variant: 'destructive',
      });
    }
  };

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

  const recipient = (() => [{
      id: user.id,
      name: user.name,
      phone: user.phone || '',
      email: user.email,
    }])();

  const headerActionsNode = (() => (
      <DetailDrawerRestoreOrEditAction
        isArchived={isArchived}
        canRestore={canDelete}
        canEdit={Boolean(onEdit)}
        restoreLabel={t('users.trash.restore')}
        editLabel={t('users.edit')}
        onRestore={onRestore ? () => onRestore(String(user.id)) : undefined}
        onEdit={onEdit ? () => onEdit(user) : undefined}
      />
    ))();

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
          <div className="space-y-2">
            <DetailSectionTitle>{t('users.detailBasic')}</DetailSectionTitle>
            <Card accentColor="info" className="divide-y divide-border/50 p-0">
              <DetailAttributeRow variant="inset" icon={Shield} label={t('users.fieldName')} value={user.name} />
              <DetailAttributeRow
                variant="inset"
                icon={Mail}
                label={t('users.fieldContactEmail')}
                value={
                  canMutate ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span>{user.email}</span>
                      <Button
                        variant="outline"
                        type="button"
                        size="icon"
                        className="rounded-lg border-secondary/30 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/15 hover:border-secondary/40 transition-colors shadow-none"
                        onClick={() => setMessagingTarget({ channel: 'email', recipients: recipient })}
                        title={t('users.sendEmail')}
                        aria-label={t('users.sendEmail')}
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ) : (
                    user.email
                  )
                }
              />
              <DetailAttributeRow
                variant="inset"
                icon={Mail}
                label={t('users.fieldLoginEmail')}
                value={
                  <div>
                    <span>{user.loginEmail?.trim() || user.email}</span>
                    {user.loginEmail && user.loginEmail.toLowerCase() !== user.email.toLowerCase() ? (
                      <p className="mt-1 text-xs text-muted-foreground">{t('users.loginEmailNote')}</p>
                    ) : null}
                  </div>
                }
              />
              <DetailAttributeRow
                variant="inset"
                icon={Shield}
                label={t('users.fieldEmailStatus')}
                value={
                  user.emailVerifiedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('users.emailVerified')} ({fmtDate(user.emailVerifiedAt)})
                    </span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t('users.emailUnverified')}
                      </span>
                      {canMutate && (
                        <Button
                          variant="outline"
                          type="button"
                          size="sm"
                          disabled={verifyEmailMutation.isPending}
                          className="h-7 text-xs px-2.5 rounded-lg border-success/40 bg-success/10 text-success hover:bg-success/20 hover:border-success/60 transition-colors shadow-none font-medium"
                          onClick={() => handleVerifyEmail()}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                          {t('users.actionVerifyEmail')}
                        </Button>
                      )}
                    </div>
                  )
                }
              />
              <DetailAttributeRow
                variant="inset"
                icon={Phone}
                label={t('users.fieldPhone')}
                value={
                  canMutate && user.phone ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span>{user.phone}</span>
                      <Button
                        variant="outline"
                        type="button"
                        size="icon"
                        className="rounded-lg border-success/30 bg-success/5 text-success hover:text-success hover:bg-success/15 hover:border-success/40 transition-colors shadow-none"
                        onClick={() => setMessagingTarget({ channel: 'whatsapp', recipients: recipient })}
                        title={t('contacts.detail.call')}
                        aria-label={t('contacts.detail.call')}
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        size="icon"
                        className="rounded-lg border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/15 hover:border-primary/40 transition-colors shadow-none"
                        onClick={() => setMessagingTarget({ channel: 'sms', recipients: recipient })}
                        title={t('users.sendSms')}
                        aria-label={t('users.sendSms')}
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ) : (
                    user.phone || '—'
                  )
                }
              />
              <DetailAttributeRow variant="inset" icon={Shield} label={t('users.detailMemberSince')} value={user.createdDate} />
              <DetailAttributeRow variant="inset" icon={Shield} label={t('users.colLastLogin')} value={fmtDate(user.lastLogin)} />
              <DetailAttributeRow variant="inset" icon={Shield} label={t('users.detailSessions')} value={user.activeSessions} />
            </Card>
          </div>

          <div className="space-y-2">
            <DetailSectionTitle>{t('users.detailRole')}</DetailSectionTitle>
            <Card accentColor="secondary" className="divide-y divide-border/50 p-0">
              <DetailAttributeRow
                variant="inset"
                icon={Shield}
                label={t('users.detailRole')}
                value={
                  workspaceRole ? (
                    <div className="space-y-2">
                      <UserRoleBadge roleId={workspaceRole.id} />
                      <p className="text-xs text-muted-foreground font-normal">{workspaceRoleDescription(workspaceRole, t)}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-normal">{t('users.detailNoRole')}</span>
                  )
                }
              />
            </Card>
          </div>

          <div className="space-y-2">
            <DetailSectionTitle>{t('users.detailPermissions')}</DetailSectionTitle>
            <Card accentColor="warning" className="divide-y divide-border/50 p-0">
              <DetailAttributeRow
                variant="inset"
                icon={Lock}
                label={t('users.detailPermissions')}
                value={
                  <div className="space-y-3">
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
                      <span className="text-muted-foreground font-normal">{t('users.detailNoPermissions')}</span>
                    ) : null}
                  </div>
                }
              />
            </Card>
          </div>

          <div className="space-y-2">
            <DetailSectionTitle>{t('users.detailSecurity')}</DetailSectionTitle>
            <Card accentColor="destructive" className="divide-y divide-border/50 p-0">
              <DetailAttributeRow
                variant="inset"
                icon={AlertTriangle}
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
              <DetailAttributeRow variant="inset" icon={AlertTriangle} label={t('users.detailFailedLogins')} value={user.failedLoginAttempts} />
            </Card>
          </div>
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
