import React, { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { UserPlus, RefreshCw, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { useTranslation } from '@/hooks/useTranslation';

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
      setError('Please enter the administrator name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password && password.length < 8) {
      setError('Password must be at least 8 characters long');
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
      setError(err instanceof Error ? err.message : 'Failed to create admin user');
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
      title="Create Admin User"
      subtitle={`Madrasa: ${workspace.madrasaName} (${workspace.subdomain})`}
      icon={UserPlus}
      size="md"
      footer={
        result ? (
          <Button type="button" onClick={handleClose} className="min-h-11 px-6 font-bold">
            {t('common.close')}
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button type="button" variant="outline" onClick={handleClose} disabled={createPending} className="min-h-11 px-4">
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleCreate} disabled={createPending} className="min-h-11 px-5 font-bold">
              {createPending ? t('common.loading') : 'Create Admin'}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4 py-2 animate-in fade-in-50 duration-200">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <Check className="w-4 h-4" />
              Admin Account Created Successfully!
            </div>

            <div className="space-y-2 text-xs text-foreground">
              <div>
                <span className="text-muted-foreground">Admin Name:</span>{' '}
                <span className="font-semibold text-foreground">{result.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Admin Email:</span>{' '}
                <span className="font-semibold text-foreground">{result.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-2xs mb-0.5">Initial Password:</span>
                  <code className="font-mono font-bold bg-background px-2.5 py-1 rounded-md border border-border text-sm text-primary inline-block">
                    {result.initialPassword}
                  </code>
                </div>
                <CopyBtn
                  text={`Name: ${result.name}\nEmail: ${result.adminEmail}\nPassword: ${result.initialPassword}`}
                  label="Copy All"
                  className="h-9 px-3 text-xs"
                  showToast
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Provide these credentials to the newly assigned madrasa administrator. They will be prompted to change their password upon first login.
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Madrasa Name:</span>{' '}
              <strong className="text-foreground">{workspace.madrasaName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Subdomain:</span>{' '}
              <strong className="text-foreground">{workspace.subdomain}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs font-semibold">
                Administrator Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-name"
                type="text"
                placeholder="e.g. Maulana Ahmad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 text-sm"
                disabled={createPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold">
                Administrator Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@madrasa.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-sm"
                disabled={createPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-semibold">
                Initial Password (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-password"
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-sm h-11 flex-1"
                  disabled={createPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                  disabled={createPending}
                  className="min-h-11 h-11 px-3 text-xs font-semibold gap-1.5 shrink-0"
                  title="Generate Random Password"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Auto
                </Button>
              </div>
            </div>

            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
