import React from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { useTranslation } from '@/hooks/useTranslation';
import type { PlatformUserProfile } from '@mms/shared';

export interface PlatformAdminActionButtonsProps {
  admin: PlatformUserProfile;
  onEditAccess: (admin: PlatformUserProfile) => void;
  onToggleStatus: (admin: PlatformUserProfile, mode: 'disable' | 'enable') => void;
  onDelete: (admin: PlatformUserProfile) => void;
  verifyPending?: boolean;
  onVerifyEmail?: (adminId: string) => void;
}

export function PlatformAdminActionButtons({
  admin,
  onEditAccess,
  onToggleStatus,
  onDelete,
  verifyPending = false,
  onVerifyEmail,
}: PlatformAdminActionButtonsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (admin.role !== 'admin') {
    return null;
  }

  const isDisabled = Boolean(admin.disabledAt);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!admin.emailVerifiedAt && onVerifyEmail ? (
        <ActionButton
          variant="secondary"
          size="sm"
          disabled={verifyPending}
          className="border-success/40 bg-success/10 text-success hover:bg-success/20 hover:border-success/60"
          onClick={() => onVerifyEmail(admin.id)}
        >
          {t('users.actionVerifyEmail')}
        </ActionButton>
      ) : null}

      <ActionButton
        variant="secondary"
        size="sm"
        onClick={() => onEditAccess(admin)}
      >
        {t('platform.editAdminAccess')}
      </ActionButton>

      <ActionButton
        variant="secondary"
        size="sm"
        onClick={() => onToggleStatus(admin, isDisabled ? 'enable' : 'disable')}
      >
        {t(isDisabled ? 'platform.enableAdmin' : 'platform.disableAdmin')}
      </ActionButton>

      <ActionButton
        variant="danger"
        size="sm"
        onClick={() => onDelete(admin)}
      >
        {t('platform.deleteAdmin')}
      </ActionButton>
    </div>
  );
}
