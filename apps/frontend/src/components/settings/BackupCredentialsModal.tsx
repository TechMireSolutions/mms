import React, { useEffect, useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCallout } from '@/components/ui/SettingsShell';

export interface BackupCredentialsModalProps {
  open: boolean;
  mode: 'export' | 'decrypt';
  adminEmail: string;
  emailReadOnly?: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (password: string, email: string) => void;
}

export default function BackupCredentialsModal({
  open,
  mode,
  adminEmail,
  emailReadOnly = false,
  loading = false,
  onClose,
  onSubmit,
}: BackupCredentialsModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      setEmail(adminEmail);
      setPassword('');
    }
  }, [open, adminEmail]);

  const title = mode === 'export' ? t('backup.encryptExportTitle') : t('backup.decryptTitle');
  const subtitle =
    mode === 'export' ? t('backup.encryptExportDesc') : t('backup.decryptDesc');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Lock}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {t('backup.confirmCancel')}
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(password, email)}
            disabled={loading || !password.trim() || !email.trim()}
          >
            {loading
              ? mode === 'export'
                ? t('backup.creating')
                : t('backup.decrypting')
              : mode === 'export'
                ? t('backup.createButton')
                : t('backup.decryptAction')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SettingsCallout>{t('backup.encryptNote')}</SettingsCallout>
        <div className="space-y-2">
          <Label htmlFor="backup-admin-email">{t('backup.adminEmailLabel')}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="backup-admin-email"
              type="email"
              value={email}
              readOnly={emailReadOnly}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              autoComplete="username"
              disabled={loading || emailReadOnly}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="backup-admin-password">{t('backup.adminPasswordLabel')}</Label>
          <Input
            id="backup-admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'export' ? 'current-password' : 'current-password'}
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
