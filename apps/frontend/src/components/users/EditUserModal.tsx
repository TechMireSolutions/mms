import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { USER_STATUS_VALUES, type SystemUser } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/hooks/useWorkspaceRoles';
import FormModal from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORM_SELECT } from '@/components/ui/formStyles';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { editUserSchema, type EditUserFormValues } from '@/lib/forms/userSchemas';
import { firstZodFieldError } from '@/lib/forms/translateZodError';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';

export interface EditUserModalProps {
  user: SystemUser;
  onClose: () => void;
  onSave: (user: SystemUser) => void;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });

  const handleSave = form.handleSubmit((values) => {
    onSave({
      ...user,
      ...values,
      avatarInitials: values.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    });
    onClose();
  });

  return (
    <FormModal
      open
      onClose={onClose}
      title={t('users.editTitle')}
      subtitle={user.email}
      icon={User}
      size="sm"
      error={firstZodFieldError(form.formState.errors, t) || undefined}
      cancelLabel={t('users.cancel')}
      saveLabel={t('users.saveChanges')}
      onSave={handleSave}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.fieldName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <TranslatedFormMessage messageKey={form.formState.errors.name?.message} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.fieldPhone')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.fieldEmail')}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <TranslatedFormMessage messageKey={form.formState.errors.email?.message} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.fieldRole')}</FormLabel>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {workspaceRoles.map((r) => (
                    <Button
                      key={r.id}
                      type="button"
                      size="sm"
                      variant={field.value === r.id ? 'default' : 'outline'}
                      onClick={() => field.onChange(r.id)}
                    >
                      {r.customLabel?.trim() || t(r.labelKey)}
                    </Button>
                  ))}
                </div>
                <TranslatedFormMessage messageKey={form.formState.errors.role?.message} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="edit-user-status">{t('users.fieldStatus')}</FormLabel>
                <FormControl>
                  <select
                    id="edit-user-status"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value as SystemUser['status'])}
                    className={FORM_SELECT}
                  >
                    {USER_STATUS_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {t(`users.status.${s}`)}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="twoFactorEnabled"
            render={({ field }) => (
              <FormItem>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-medium text-foreground">{t('users.field2fa')}</span>
                </label>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormModal>
  );
}
