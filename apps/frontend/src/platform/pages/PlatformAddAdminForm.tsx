import React, { useState } from 'react';
import { Mail, User, UserPlus, ShieldPlus } from 'lucide-react';
import { DEFAULT_PLATFORM_ADMIN_PERMISSIONS, type PlatformAdminPermissions } from '@mms/shared';
import PasswordInput from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { FormModal } from '@/components/ui/FormModal';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTranslation } from '@/hooks/useTranslation';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { getPlatformRegisterError } from '@/platform/lib/platformValidation';
import { useAddPlatformAdmin } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminPermissionsFields } from '@/platform/components/PlatformAdminPermissionsFields';
import { getPasswordStrength } from '@/tenant/features/profile/passwordStrength';
import { cn } from '@/lib/utils';

export function PlatformAddAdminForm({ asTriggerOnly = false }: { asTriggerOnly?: boolean } = {}): React.JSX.Element {
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

  const passwordStrength = getPasswordStrength(password);

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



  const content = (
    <>
      <Button
        type="button"
        className={cn(
          "font-bold min-h-11 rounded-xl shadow-sm shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer",
          asTriggerOnly ? "px-5" : "w-full"
        )}
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
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="admin-name" className={FORM_LABEL}>
              {t('platform.adminName')}
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="admin-name"
                name="adminName"
                type="text"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (submitError) setSubmitError(null);
                }}
                className="ps-9 min-h-11 rounded-xl"
                disabled={addAdmin.isPending}
                placeholder="Full Operator Name"
              />
            </div>
          </div>

          {/* Email Address Field */}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className={FORM_LABEL}>
              {t('platform.adminEmail')}
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="admin-email"
                name="adminEmail"
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (submitError) setSubmitError(null);
                }}
                className="ps-9 min-h-11 rounded-xl"
                disabled={addAdmin.isPending}
                placeholder="operator@platform.com"
              />
            </div>
          </div>

          {/* Password Field & Real-time Strength Bar */}
          <div className="space-y-2">
            <PasswordInput
              id="admin-password"
              name="adminPassword"
              label={t('platform.adminPassword')}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (submitError) setSubmitError(null);
              }}
              disabled={addAdmin.isPending}
            />

            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex h-1.5 w-full gap-1.5 overflow-hidden rounded-full bg-muted">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-full flex-1 transition-all duration-300',
                        passwordStrength.score >= level ? passwordStrength.colorClass : 'bg-muted/40',
                      )}
                    />
                  ))}
                </div>
                {passwordStrength.key && (
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {t(passwordStrength.key)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Capability Flags */}
          <PlatformAdminPermissionsFields
            value={permissions}
            onChange={setPermissions}
            disabled={addAdmin.isPending}
          />
        </div>
      </FormModal>
    </>
  );

  if (asTriggerOnly) {
    return content;
  }

  return (
    <SectionCard
      title={t('platform.addAdmin')}
      subtitle={t('platform.addAdminSubtitle')}
      icon={ShieldPlus}
      accentColor="primary"
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('platform.addAdminCardDesc')}
        </p>
        {content}
      </div>
    </SectionCard>
  );
}
