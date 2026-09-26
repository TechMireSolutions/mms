import React, { useId, useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { UserPlus, User, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field, FieldErrorMessage } from '@/components/ui/FormField';
import { LeadingIconInput } from '@/components/ui/LeadingIconInput';
import { WorkspaceSummary } from '@/platform/components/workspace/WorkspaceSummary';
import { WorkspacePasswordField } from '@/platform/components/workspace/WorkspacePasswordField';
import { WorkspaceAdminDialogFooter } from '@/platform/components/workspace/WorkspaceAdminDialogFooter';
import { useTranslation } from '@/hooks/useTranslation';
import { CreateAdminResultCard } from '@/platform/components/workspace/CreateAdminResultCard';

interface PlatformWorkspaceCreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: PlatformWorkspaceRowData | null;
  createPending: boolean;
  onConfirm: (
    subdomain: string,
    data: { name: string; email: string; password?: string },
  ) => Promise<{ initialPassword: string; adminEmail: string; name: string }>;
}

export function PlatformWorkspaceCreateAdminDialog({
  open,
  onOpenChange,
  workspace,
  createPending,
  onConfirm,
}: PlatformWorkspaceCreateAdminDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const nameId = useId();
  const emailId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ initialPassword: string; adminEmail: string; name: string } | null>(null);
  const [error, setError] = useState('');

  if (!workspace) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t('platform.validationEnterName'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('platform.validationEnterValidEmail'));
      return;
    }
    if (password && password.length < 8) {
      setError(t('platform.validationPasswordLength'));
      return;
    }
    setError('');
    try {
      const res = await onConfirm(workspace.subdomain, {
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('platform.loadFailed'));
    }
  };

  const handleClose = () => {
    if (createPending) return;
    setName('');
    setEmail('');
    setPassword('');
    setResult(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      dismissible={!createPending}
      title={t('platform.createAdminUser')}
      subtitle={t('platform.createAdminSubtitle', { name: workspace.madrasaName, subdomain: workspace.subdomain })}
      icon={UserPlus}
      size="md"
      footer={
        <WorkspaceAdminDialogFooter complete={Boolean(result)} pending={createPending}
          confirmLabel={t('platform.createAdminBtn')}
          onClose={handleClose} onConfirm={handleCreate} />
      }
    >
      {result ? (
        <CreateAdminResultCard
          name={result.name}
          adminEmail={result.adminEmail}
          initialPassword={result.initialPassword}
        />
      ) : (
        <div className="space-y-4 py-2">
          <WorkspaceSummary workspace={workspace} />

          <div className="space-y-3">
            <Field label={t('platform.adminNameLabel')} required error={!name.trim() && error ? error : undefined}>
              <LeadingIconInput
                icon={User}
                type="text"
                id={nameId}
                placeholder={t('platform.adminNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-sm"
                disabled={createPending}
              />
            </Field>

            <Field label={t('platform.adminEmailLabel')} required>
              <LeadingIconInput
                icon={Mail}
                type="email"
                id={emailId}
                placeholder={t('platform.adminEmailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-sm"
                disabled={createPending}
              />
            </Field>

            <WorkspacePasswordField
              label={t('platform.initialPasswordLabel')}
              placeholder={t('platform.initialPasswordPlaceholder')}
              value={password} onChange={setPassword} pending={createPending}
            />

            {error ? <FieldErrorMessage message={error} /> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
