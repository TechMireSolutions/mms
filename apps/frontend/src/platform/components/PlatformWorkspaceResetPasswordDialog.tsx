import React, { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { KeyRound, RefreshCw, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { useTranslation } from '@/hooks/useTranslation';

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

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let res = 'Mms#';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

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
    setPassword('');
    setResult(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('platform.resetPasswordTitle')}
      subtitle={t('platform.createAdminSubtitle', { name: workspace.madrasaName, subdomain: workspace.subdomain })}
      icon={KeyRound}
      size="md"
      footer={
        result ? (
          <Button type="button" onClick={handleClose} className="min-h-11 px-6 font-bold cursor-pointer">
            {t('common.close')}
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button type="button" variant="outline" onClick={handleClose} disabled={resetPending} className="min-h-11 px-4 cursor-pointer">
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleReset} disabled={resetPending} className="min-h-11 px-5 font-bold cursor-pointer">
              {resetPending ? t('common.loading') : t('platform.resetPasswordBtn')}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4 py-2 animate-in fade-in-50 duration-200">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-success font-bold text-sm">
              <Check className="w-4 h-4" />
              {t('platform.resetPasswordSuccess')}
            </div>

            <div className="space-y-2 text-xs text-foreground">
              <div>
                <span className="text-muted-foreground">{t('platform.adminEmailValue')}</span>{' '}
                <span className="font-semibold text-foreground">{result.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-2xs mb-0.5">{t('platform.newPasswordValue')}</span>
                  <code className="font-mono font-bold bg-background px-2.5 py-1 rounded-md border border-border text-sm text-primary inline-block">
                    {result.newPassword}
                  </code>
                </div>
                <CopyBtn text={result.newPassword} label={t('contacts.table.copy')} className="min-h-11 h-11 px-3 text-xs" showToast />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('platform.sharePasswordHint')}
          </p>
        </div>
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
            <div>
              <span className="text-muted-foreground">{t('platform.adminEmailLabel')}:</span>{' '}
              <strong className="text-foreground">{workspace.adminEmail || '—'}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-admin-password" className="text-xs font-semibold">
              {t('platform.newPasswordLabel')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-admin-password"
                type="text"
                placeholder={t('platform.newPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono text-sm h-11"
                disabled={resetPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                disabled={resetPending}
                className="min-h-11 h-11 px-3 text-xs font-semibold gap-1.5 shrink-0 cursor-pointer"
                title={t('platform.autoGenerateTitle')}
                aria-label={t('platform.autoGenerateTitle')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('platform.autoGenerateBtn')}
              </Button>
            </div>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
