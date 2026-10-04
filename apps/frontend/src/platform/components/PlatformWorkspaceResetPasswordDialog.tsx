import React, { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { KeyRound } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { CredentialsResultCard } from '@/components/ui/CredentialsResultCard';
import { useTranslation } from '@/hooks/useTranslation';
import { WorkspaceSummary } from '@/platform/components/workspace/WorkspaceSummary';
import { WorkspacePasswordField } from '@/platform/components/workspace/WorkspacePasswordField';

interface PlatformWorkspaceResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: PlatformWorkspaceRowData | null;
  resetPending: boolean;
  onConfirm: (subdomain: string, newPassword?: string) => Promise<{ newPassword: string; adminEmail: string }>;
}

export function PlatformWorkspaceResetPasswordDialog({
  open,
  onOpenChange,
  workspace,
  resetPending,
  onConfirm,
}: PlatformWorkspaceResetPasswordDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ newPassword: string; adminEmail: string } | null>(null);
  const [error, setError] = useState('');

  if (!workspace) return null;

  const handleReset = async () => {
    if (password && password.length < 8) {
      setError(t('platform.validationPasswordLength'));
      return;
    }
    setError('');
    try {
      const res = await onConfirm(workspace.subdomain, password || undefined);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('platform.loadFailed'));
    }
  };

  const handleClose = () => {
    if (resetPending) return;
    setPassword('');
    setResult(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={t('platform.resetPasswordTitle')}
      subtitle={t('platform.createAdminSubtitle', { name: workspace.madrasaName, subdomain: workspace.subdomain })}
      icon={KeyRound}
      size="md"
      error={result ? undefined : (error && error !== t('platform.validationPasswordLength') ? error : undefined)}
      cancelLabel={result ? undefined : t('common.cancel')}
      saveLabel={result ? t('common.close') : t('platform.resetPasswordBtn')}
      onSave={result ? handleClose : handleReset}
      saving={resetPending}
      formId={result ? undefined : 'platform-reset-password-form'}
    >
      {result ? (
        <CredentialsResultCard
          title={t('platform.resetPasswordSuccess')}
          fields={[{ label: t('platform.adminEmailValue'), value: result.adminEmail }]}
          passwordLabel={t('platform.newPasswordValue')}
          password={result.newPassword}
          copyText={result.newPassword}
          copyLabel={t('common.copy')}
          hint={t('platform.sharePasswordHint')}
        />
      ) : (
        <form
          id="platform-reset-password-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleReset();
          }}
          className="space-y-3"
        >
          <WorkspaceSummary workspace={workspace} showAdminEmail />

          <WorkspacePasswordField
            label={t('platform.newPasswordLabel')}
            placeholder={t('platform.newPasswordPlaceholder')}
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (error) setError('');
            }}
            pending={resetPending}
            error={error || undefined}
          />
        </form>
      )}
    </FormModal>
  );
}
