import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import type { PlatformAdminPermissions, PlatformUserProfile } from '@mms/shared';
import { normalizePlatformAdminPermissions } from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { useUpdatePlatformAdminPermissions } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminPermissionsFields } from '@/platform/components/PlatformAdminPermissionsFields';

interface PlatformEditAdminAccessDialogProps {
  admin: PlatformUserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformEditAdminAccessDialog({
  admin,
  open,
  onOpenChange,
}: PlatformEditAdminAccessDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const updatePermissions = useUpdatePlatformAdminPermissions();
  const [permissions, setPermissions] = useState<PlatformAdminPermissions>(() =>
    normalizePlatformAdminPermissions(admin.permissions),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPermissions(normalizePlatformAdminPermissions(admin.permissions));
      setError(null);
    }
  }, [open, admin]);

  const handleSave = async (): Promise<void> => {
    setError(null);
    try {
      await updatePermissions.mutateAsync({
        adminId: admin.id,
        permissions,
      });
      onOpenChange(false);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <FormModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('platform.editAdminAccessTitle')}
      subtitle={`${admin.name} · ${admin.email}`}
      icon={Shield}
      size="sm"
      error={error ?? undefined}
      cancelLabel={t('common.cancel')}
      saveLabel={t('platform.editAdminAccessSave')}
      onSave={handleSave}
      saving={updatePermissions.isPending}
      dir="ltr"
      lang="en"
    >
      <PlatformAdminPermissionsFields
        value={permissions}
        onChange={setPermissions}
        disabled={updatePermissions.isPending}
      />
    </FormModal>
  );
}
