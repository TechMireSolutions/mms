import React from 'react';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  type filterRbacModulesForSettings,
  type resolveWorkspaceRole,
  workspaceRoleDescription,
  type PermissionAction,
  type SystemUser,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { UserRoleBadge } from '@/tenant/features/users/components/UserBadges';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import { UserDetailBasicCard } from '@/tenant/features/users/components/UserDetailBasicCard';
import { UserDetailPermissionsCard } from '@/tenant/features/users/components/UserDetailPermissionsCard';

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

  return (
    <div className="space-y-4">
      <UserDetailBasicCard
        user={user}
        canMutate={canMutate}
        fmtDate={fmtDate}
        onCompose={onCompose}
        onVerifyEmail={onVerifyEmail}
        verifyEmailPending={verifyEmailPending}
      />

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

      <UserDetailPermissionsCard
        effectivePerms={effectivePerms}
        visibleModules={visibleModules}
      />

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