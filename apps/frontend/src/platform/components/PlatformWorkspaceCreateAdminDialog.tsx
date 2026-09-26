import React, { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { UserPlus, RefreshCw, User, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/FormField';
import { LeadingIconInput } from '@/components/ui/LeadingIconInput';
import { ActionButton } from '@/components/ui/ActionButton';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ initialPassword: string; adminEmail: string; name: string } | null>(null);
  const [error, setError] = useState('');

  if (!workspace) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let res = 'Mms#';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

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
      title={t('platform.createAdminUser')}
      subtitle={t('platform.createAdminSubtitle', { name: workspace.madrasaName, subdomain: workspace.subdomain })}
      icon={UserPlus}
      size="md"
      footer={
        result ? (
          <ActionButton variant="primary" onClick={handleClose}>
            {t('common.close')}
          </ActionButton>
        ) : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <ActionButton variant="secondary" onClick={handleClose} disabled={createPending}>
              {t('common.cancel')}
            </ActionButton>
            <ActionButton variant="primary" onClick={handleCreate} loading={createPending}>
              {t('platform.createAdminBtn')}
            </ActionButton>
          </div>
        )
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
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">{t('platform.descriptor.workspace.madrasaName')}:</span>{' '}
              <strong className="text-foreground">{workspace.madrasaName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">{t('platform.descriptor.workspace.subdomain')}:</span>{' '}
              <strong className="text-foreground">{workspace.subdomain}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <Field label={t('platform.adminNameLabel')} required error={!name.trim() && error ? error : undefined}>
              <LeadingIconInput
                icon={User}
                type="text"
                id="admin-name"
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
                id="admin-email"
                placeholder={t('platform.adminEmailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-sm"
                disabled={createPending}
              />
            </Field>

            <Field label={t('platform.initialPasswordLabel')}>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-password"
                  type="text"
                  placeholder={t('platform.initialPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-sm h-11 flex-1"
                  disabled={createPending}
                />
                <ActionButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={generateRandomPassword}
                  disabled={createPending}
                  className="shrink-0 cursor-pointer font-semibold"
                  title={t('platform.autoGenerateTitle')}
                  aria-label={t('platform.autoGenerateTitle')}
                >
                  {t('platform.autoGenerateBtn')}
                </ActionButton>
              </div>
            </Field>

            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
