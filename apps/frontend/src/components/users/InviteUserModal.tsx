import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { USER_STATUS_VALUES, type SystemUser } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FORM_SELECT } from '@/components/ui/formStyles';

export interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (user: SystemUser) => void;
}

interface InviteFormState {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: SystemUser['status'];
  sendEmail: boolean;
}

export default function InviteUserModal({ onClose, onInvite }: InviteUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const [form, setForm] = useState<InviteFormState>({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'inactive',
    sendEmail: true,
  });
  const [error, setError] = useState('');

  const set = <K extends keyof InviteFormState>(k: K, v: InviteFormState[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError(t('users.errorNameEmailRequired'));
      return;
    }
    if (!form.role) {
      setError(t('users.errorRoleRequired'));
      return;
    }
    const user: SystemUser = {
      id: `u${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.status,
      avatarInitials: form.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      lastLogin: '',
      createdDate: new Date().toISOString().slice(0, 10),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      activeSessions: 0,
    };
    onInvite(user);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('users.inviteTitle')}
      subtitle={t('users.inviteSubtitle')}
      icon={UserPlus}
      size="sm"
      footer={
        <div className="flex w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {t('users.cancel')}
          </Button>
          <Button type="submit" form="invite-user-form" className="flex-1">
            {t('users.inviteSubmit')}
          </Button>
        </div>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="invite-name">{t('users.fieldName')}</Label>
            <Input id="invite-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="invite-phone">{t('users.fieldPhone')}</Label>
            <Input id="invite-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="invite-email">{t('users.fieldEmail')}</Label>
          <Input id="invite-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <Label>{t('users.fieldRole')}</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {workspaceRoles.map((r) => (
              <Button
                key={r.id}
                type="button"
                size="sm"
                variant={form.role === r.id ? 'default' : 'outline'}
                onClick={() => set('role', r.id)}
              >
                {r.customLabel?.trim() || t(r.labelKey)}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="invite-status">{t('users.fieldStatus')}</Label>
          <select
            id="invite-status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as SystemUser['status'])}
            className={FORM_SELECT}
          >
            {USER_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {t(`users.status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.sendEmail}
            onChange={(e) => set('sendEmail', e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-foreground">{t('users.inviteSendEmail')}</span>
        </label>
      </form>
    </Modal>
  );
}
