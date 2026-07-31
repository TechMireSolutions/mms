import React, { useState } from 'react';
import { Mail, User, UserPlus } from 'lucide-react';
import { DEFAULT_PLATFORM_ADMIN_PERMISSIONS, type PlatformAdminPermissions } from '@mms/shared';
import PasswordInput from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { getPlatformRegisterError } from '@/platform/lib/platformValidation';
import { useAddPlatformAdmin } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminPermissionsFields } from '@/platform/components/PlatformAdminPermissionsFields';

export function PlatformAddAdminForm(): React.JSX.Element {
  const { t } = useTranslation();
  const addAdmin = useAddPlatformAdmin();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<PlatformAdminPermissions>(
    DEFAULT_PLATFORM_ADMIN_PERMISSIONS,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = (): void => {
    setName('');
    setEmail('');
    setPassword('');
    setPermissions(DEFAULT_PLATFORM_ADMIN_PERMISSIONS);
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean): void => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSave = async (): Promise<void> => {
    setSubmitError(null);

    const validationError = getPlatformRegisterError(name, email, password, t);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      await addAdmin.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        permissions,
      });
      handleOpenChange(false);
    } catch (err) {
      setSubmitError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
        {t('platform.addAdmin')}
      </h2>
      <Button
        type="button"
        className="w-full font-bold min-h-11 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="w-4 h-4 me-2" aria-hidden />
        {t('platform.addAdmin')}
      </Button>

      <FormModal
        open={open}
        onClose={() => handleOpenChange(false)}
        title={t('platform.addAdmin')}
        icon={UserPlus}
        size="md"
        error={submitError ?? undefined}
        cancelLabel={t('common.cancel')}
        saveLabel={t('platform.addAdmin')}
        onSave={handleSave}
        saving={addAdmin.isPending}
        dir="ltr"
        lang="en"
      >
        <div className="space-y-4 text-start">
          <div className="space-y-1.5">
            <label htmlFor="admin-name" className={FORM_LABEL}>{t('platform.adminName')}</label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="admin-name"
                name="adminName"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="ps-9 min-h-11"
                disabled={addAdmin.isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className={FORM_LABEL}>{t('platform.adminEmail')}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="admin-email"
                name="adminEmail"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ps-9 min-h-11"
                disabled={addAdmin.isPending}
              />
            </div>
          </div>

          <PasswordInput
            id="admin-password"
            name="adminPassword"
            label={t('platform.adminPassword')}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={addAdmin.isPending}
          />

          <PlatformAdminPermissionsFields
            value={permissions}
            onChange={setPermissions}
            disabled={addAdmin.isPending}
          />
        </div>
      </FormModal>
    </div>
  );
}
