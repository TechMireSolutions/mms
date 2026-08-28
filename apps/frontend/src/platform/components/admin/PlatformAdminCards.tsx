import React from 'react';
import { Mail } from 'lucide-react';
import { formatDate, type PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { useVerifyPlatformAdminEmail } from '@/platform/hooks/usePlatformAdmins';
import {
  PlatformAdminStatusBadges,
  PlatformAdminPermissionsBadges,
} from '@/platform/components/admin/PlatformAdminBadges';
import { PlatformAdminActionButtons } from '@/platform/components/admin/PlatformAdminActionButtons';

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
  const verifyEmailMutation = useVerifyPlatformAdminEmail();

  return (
    <ModuleDirectoryCards
      items={admins}
      selectedIds={[]}
      renderItem={(admin) => (
        <DirectoryEntityCard
          key={admin.id}
          accentClassName={admin.role === 'super_user' ? 'bg-primary/80' : undefined}
          className="flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{admin.name}</p>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <PlatformAdminStatusBadges admin={admin} />
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 truncate">{admin.email}</span>
            </div>
            <PlatformAdminPermissionsBadges admin={admin} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 mt-3">
            {admin.createdAt ? (
              <p className="text-xs text-muted-foreground/60 font-semibold">
                {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
              </p>
            ) : (
              <span />
            )}
            <PlatformAdminActionButtons
              admin={admin}
              onEditAccess={onEditAccess}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              verifyPending={verifyEmailMutation.isPending}
              onVerifyEmail={(adminId) => verifyEmailMutation.mutate(adminId)}
            />
          </div>
        </DirectoryEntityCard>
      )}
    />
  );
}

