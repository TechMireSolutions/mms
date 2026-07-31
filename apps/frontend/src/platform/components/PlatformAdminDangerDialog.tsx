import React, { useEffect, useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import PasswordInput from '@/components/ui/PasswordInput';
import { useTranslation } from '@/hooks/useTranslation';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import {
  useDeletePlatformAdmin,
  useSetPlatformAdminDisabled,
} from '@/platform/hooks/usePlatformAdmins';

type AdminDangerMode = 'disable' | 'enable' | 'delete';

interface PlatformAdminDangerDialogProps {
  admin: PlatformUserProfile;
  mode: AdminDangerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformAdminDangerDialog({
  admin,
  mode,
  open,
  onOpenChange,
}: PlatformAdminDangerDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const setDisabled = useSetPlatformAdminDisabled();
  const deleteAdmin = useDeletePlatformAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pending = setDisabled.isPending || deleteAdmin.isPending;

  useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
    }
  }, [open, mode, admin.id]);

  const titleKey =
    mode === 'delete'
      ? 'platform.deleteAdminTitle'
      : mode === 'disable'
        ? 'platform.disableAdminTitle'
        : 'platform.enableAdminTitle';
  const descKey =
    mode === 'delete'
      ? 'platform.deleteAdminDesc'
      : mode === 'disable'
        ? 'platform.disableAdminDesc'
        : 'platform.enableAdminDesc';
  const saveKey =
    mode === 'delete'
      ? 'platform.deleteAdminConfirm'
      : mode === 'disable'
        ? 'platform.disableAdminConfirm'
        : 'platform.enableAdminConfirm';

  const handleSave = async (): Promise<void> => {
    if (!password.trim()) return;
    setError(null);
    try {
      if (mode === 'delete') {
        await deleteAdmin.mutateAsync({ adminId: admin.id, password });
      } else {
        await setDisabled.mutateAsync({
          adminId: admin.id,
          disabled: mode === 'disable',
          password,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <FormModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={t(titleKey)}
      subtitle={`${admin.name} · ${admin.email}`}
      icon={mode === 'delete' ? Trash2 : ShieldAlert}
      size="sm"
      error={error ?? undefined}
      cancelLabel={t('common.cancel')}
      saveLabel={t(saveKey)}
      onSave={handleSave}
      saving={pending}
      saveDisabled={!password.trim()}
      dir="ltr"
      lang="en"
    >
      <div className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
        <PasswordInput
          id="platform-admin-danger-password"
          name="adminDangerPassword"
          label={t('platform.adminPasswordConfirm')}
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError(null);
          }}
          disabled={pending}
        />
      </div>
    </FormModal>
  );
}
