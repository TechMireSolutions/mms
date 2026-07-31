import React, { useState } from 'react';
import type { PlatformAdminPermissions, PlatformUserProfile } from '@mms/shared';
import { normalizePlatformAdminPermissions } from '@mms/shared';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { useUpdatePlatformAdminPermissions } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminPermissionsFields } from '@/platform/components/PlatformAdminPermissionsFields';
import { Alert } from '@/components/ui/Alert';

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

  const handleOpenChange = (next: boolean): void => {
    if (next) {
      setPermissions(normalizePlatformAdminPermissions(admin.permissions));
      setError(null);
    }
    onOpenChange(next);
  };

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
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('platform.editAdminAccessTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {admin.name} · {admin.email}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <Alert message={error} /> : null}

        <PlatformAdminPermissionsFields
          value={permissions}
          onChange={setPermissions}
          disabled={updatePermissions.isPending}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={updatePermissions.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            className="min-h-11"
            disabled={updatePermissions.isPending}
            onClick={() => void handleSave()}
          >
            {t('platform.editAdminAccessSave')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
