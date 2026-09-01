import React, { lazy, Suspense } from 'react';
import { Shield } from 'lucide-react';
import {
  filterRbacModulesForSettings,
  formatDate,
  resolveWorkspaceRole,
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
import { UserRoleBadge, UserStatusBadge } from '@/tenant/features/users/components/UserBadges';
import { useToast } from '@/components/ui/use-toast';
import { useUsersContractVerifyEmail } from '@/tenant/hooks/collections/users';
import { UserDetailSections } from '@/tenant/features/users/components/UserDetailSections';

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

  const [messagingTarget, setMessagingTarget] = React.useState<{
    channel: 'sms' | 'whatsapp' | 'email';
    recipients: Array<{ id: string; name: string; phone: string; email: string }>;
  } | null>(null);

  const isArchived = Boolean(user.deletedAt);
  const canMutate = !isArchived;

  const workspaceRole = resolveWorkspaceRole(user.role, workspaceRoles);
  const effectivePerms = workspaceRole?.permissions ?? {};

  const fmtDate = (ts: string): string => {
    if (!ts) return t('users.never');
    return formatDate(ts, globalSettings.dateFormat, false);
  };

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

  const handleCompose = (channel: 'sms' | 'whatsapp' | 'email') => {
    setMessagingTarget({
      channel,
      recipients: [{ id: user.id, name: user.name, phone: user.phone || '', email: user.email }],
    });
  };

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

        <UserDetailSections
          user={user}
          canMutate={canMutate}
          fmtDate={fmtDate}
          workspaceRole={workspaceRole}
          effectivePerms={effectivePerms}
          visibleModules={filterRbacModulesForSettings(globalSettings.enabledModules)}
          onCompose={handleCompose}
          onVerifyEmail={() => void handleVerifyEmail()}
          verifyEmailPending={verifyEmailMutation.isPending}
        />
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