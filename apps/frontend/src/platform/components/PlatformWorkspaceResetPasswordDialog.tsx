import React, { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { KeyRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CredentialsResultCard } from '@/components/ui/CredentialsResultCard';
import { useTranslation } from '@/hooks/useTranslation';
import { WorkspaceSummary } from '@/platform/components/workspace/WorkspaceSummary';
import { WorkspacePasswordField } from '@/platform/components/workspace/WorkspacePasswordField';
import { WorkspaceAdminDialogFooter } from '@/platform/components/workspace/WorkspaceAdminDialogFooter';

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
    <Modal
      open={open}
      onClose={handleClose}
      dismissible={!resetPending}
      title={t('platform.resetPasswordTitle')}
      subtitle={t('platform.createAdminSubtitle', { name: workspace.madrasaName, subdomain: workspace.subdomain })}
      icon={KeyRound}
      size="md"
      footer={
        <WorkspaceAdminDialogFooter complete={Boolean(result)} pending={resetPending}
          confirmLabel={t('platform.resetPasswordBtn')}
          onClose={handleClose} onConfirm={handleReset} />
      }
    >
      {result ? (
        <CredentialsResultCard
          title={t('platform.resetPasswordSuccess')}
          fields={[{ label: t('platform.adminEmailValue'), value: result.adminEmail }]}
          passwordLabel={t('platform.newPasswordValue')}
          password={result.newPassword} copyText={result.newPassword}
          copyLabel={t('contacts.table.copy')} hint={t('platform.sharePasswordHint')}
        />
      ) : (
        <div className="space-y-4 py-2">
          <WorkspaceSummary workspace={workspace} showAdminEmail />

          <WorkspacePasswordField
            label={t('platform.newPasswordLabel')}
            placeholder={t('platform.newPasswordPlaceholder')}
            value={password} onChange={setPassword} pending={resetPending}
            error={error || undefined}
          />
        </div>
      )}
    </Modal>
  );
}
