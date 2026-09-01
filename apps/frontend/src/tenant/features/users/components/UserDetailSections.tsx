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
import { Button } from '@/components/ui/button';
import { UserRoleBadge } from '@/tenant/features/users/components/UserBadges';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';

export interface UserDetailSectionsProps {
  user: SystemUser;
  canMutate: boolean;
  fmtDate: (ts: string) => string;
  workspaceRole: ReturnType<typeof resolveWorkspaceRole> | null;
  effectivePerms: Record<string, PermissionAction[]>;
  visibleModules: ReturnType<typeof filterRbacModulesForSettings>;
  onCompose: (channel: 'sms' | 'whatsapp' | 'email') => void;
  onVerifyEmail: () => void;
  verifyEmailPending: boolean;
}

/** Basic / Role / Permissions / Security cards inside the user detail drawer. */
export function UserDetailSections({
  user,
  canMutate,
  fmtDate,
  workspaceRole,
  effectivePerms,
  visibleModules,
  onCompose,
  onVerifyEmail,
  verifyEmailPending,
}: UserDetailSectionsProps): React.JSX.Element {
  const { t } = useTranslation();

  const composeChannel = (channel: 'sms' | 'whatsapp' | 'email') => () => onCompose(channel);

  return (
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
                    onClick={composeChannel('email')}
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
                      disabled={verifyEmailPending}
                      className="h-7 text-xs px-2.5 rounded-lg border-success/40 bg-success/10 text-success hover:bg-success/20 hover:border-success/60 transition-colors shadow-none font-medium"
                      onClick={onVerifyEmail}
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
                    onClick={composeChannel('whatsapp')}
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
                    onClick={composeChannel('sms')}
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
  );
}