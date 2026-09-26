import React from 'react';
import type { PlatformUserProfile } from '@mms/shared';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCard } from '@/components/ui/DirectoryCard';
import { DirectoryCardMetadata } from '@/components/ui/DirectoryCardMetadata';
import {
  PlatformAdminStatusBadges,
  PlatformAdminPermissionsBadges,
} from '@/platform/components/admin/PlatformAdminBadges';
import { PlatformAdminActionButtons } from '@/platform/components/admin/PlatformAdminActionButtons';
import type { EntityDescriptor } from '@/types/entityRegistry';

export interface PlatformAdminsListCardsProps {
  admins: PlatformUserProfile[];
  descriptor: EntityDescriptor<PlatformUserProfile>;
  onInspect: (admin: PlatformUserProfile) => void;
  onEditAccess: (admin: PlatformUserProfile) => void;
  onToggleStatus: (admin: PlatformUserProfile, mode: 'disable' | 'enable') => void;
  onDelete: (admin: PlatformUserProfile) => void;
  verifyPending?: boolean;
  onVerifyEmail?: (adminId: string) => void;
}

/**
 * Directory cards view for Platform Administrators, aligning with MMS [Entity]ListCards conventions.
 */
export function PlatformAdminsListCards({
  admins,
  descriptor,
  onInspect,
  onEditAccess,
  onToggleStatus,
  onDelete,
  verifyPending = false,
  onVerifyEmail,
}: PlatformAdminsListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <DirectoryCardsGrid>
      {admins.map((admin) => (
        <DirectoryCard
          key={admin.id}
          entity={admin}
          reducedMotion={reducedMotion}
          accentClassName={admin.role === 'super_user' ? 'bg-primary/80 group-hover:bg-primary' : 'bg-primary/50 group-hover:bg-primary'}
          className="flex flex-col justify-between cursor-pointer"
          onView={onInspect}
          headerSlot={
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{admin.name}</p>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <PlatformAdminStatusBadges admin={admin} />
              </div>
            </div>
          }
          metadataSlot={
            <DirectoryCardMetadata descriptor={descriptor} entity={admin} visibleColumnIds={['email']} />
          }
          footer={
            <div
              className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 mt-3 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {admin.createdAt ? (
                <p className="text-xs text-muted-foreground font-semibold">
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
                verifyPending={verifyPending}
                onVerifyEmail={onVerifyEmail}
              />
            </div>
          }
        >
          <PlatformAdminPermissionsBadges admin={admin} />
        </DirectoryCard>
      ))}
    </DirectoryCardsGrid>
  );
}

/** Backward-compatible alias aligning with singular/plural naming variants. */
export type PlatformAdminListCardsProps = PlatformAdminsListCardsProps;
export const PlatformAdminListCards = PlatformAdminsListCards;
