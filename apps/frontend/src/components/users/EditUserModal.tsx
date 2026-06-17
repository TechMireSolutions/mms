import React, { useState } from 'react';
import { Save, User } from 'lucide-react';
import {
  USER_STATUS_VALUES,
  type SystemUser,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FORM_SELECT } from '@/components/ui/formStyles';

export interface EditUserModalProps {
  user: SystemUser;
  onClose: () => void;
  onSave: (user: SystemUser) => void;
}

interface EditUserFormState {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: SystemUser['status'];
  twoFactorEnabled: boolean;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const [form, setForm] = useState<EditUserFormState>({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
  });
  const [error, setError] = useState('');

  const set = <K extends keyof EditUserFormState>(k: K, v: EditUserFormState[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSave = (): void => {
    if (!form.name.trim()) {
      setError(t('users.errorNameRequired'));
      return;
    }
    if (!form.email.trim()) {
      setError(t('users.errorEmailRequired'));
      return;
    }
    if (!form.role) {
      setError(t('users.errorRoleRequired'));
      return;
    }
    onSave({
      ...user,
      ...form,
      avatarInitials: form.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('users.editTitle')}
      subtitle={user.email}
      icon={User}
      size="sm"
      footer={
        <div className="flex w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {t('users.cancel')}
          </Button>
          <Button type="button" className="flex-1" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            {t('users.saveChanges')}
          </Button>
        </div>
      }
    >
      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-user-name">{t('users.fieldName')}</Label>
            <Input
              id="edit-user-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-user-phone">{t('users.fieldPhone')}</Label>
            <Input
              id="edit-user-phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="edit-user-email">{t('users.fieldEmail')}</Label>
          <Input
            id="edit-user-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
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
          <Label htmlFor="edit-user-status">{t('users.fieldStatus')}</Label>
          <select
            id="edit-user-status"
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
            checked={form.twoFactorEnabled}
            onChange={(e) => set('twoFactorEnabled', e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-foreground">{t('users.field2fa')}</span>
        </label>
      </div>
    </Modal>
  );
}
