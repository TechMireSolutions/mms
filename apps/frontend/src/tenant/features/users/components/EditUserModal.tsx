import React, { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { USER_STATUS_VALUES, toTitleCase, type SystemUser, getInitials } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useContactById } from '@/tenant/features/contacts/hooks/useContacts';
import { FormModal } from '@/components/ui/FormModal';
import ContactPicker from '@/tenant/features/contacts/components/contactLink/ContactPicker';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { Checkbox } from '@/components/ui/checkbox';
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

function resolveContactId(user: SystemUser): string | number | null {
  return user.contactId ?? null;
}

export function EditUserModal({ user, onClose, onSave }: EditUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const initialContactId = useMemo(() => resolveContactId(user), [user]);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      contactId: initialContactId ?? '',
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });

  const watchedContactId = form.watch('contactId');
  const { data: selectedContact } = useContactById(
    watchedContactId ? String(watchedContactId) : undefined,
    Boolean(watchedContactId),
  );

  const handleSave = form.handleSubmit((values) => {
    const contact = selectedContact;
    if (!contact) return;
    const name = toTitleCase(contact.name.trim()) as string;
    const email = (contact.emails?.[0]?.address || '').trim().toLowerCase();
    const phone = (contact.phones?.[0]?.number || '').trim();
    onSave({
      ...user,
      contactId: contact.id,
      name,
      email,
      phone,
      role: values.role,
      status: values.status,
      twoFactorEnabled: values.twoFactorEnabled,
      avatarInitials: getInitials(name),
    });
    onClose();
  });

  return (
    <FormModal
      open
      onClose={onClose}
      title={t('users.editTitle')}
      subtitle={selectedContact?.name || user.name}
      icon={User}
      error={firstZodFieldError(form.formState.errors, t) || undefined}
      cancelLabel={t('users.cancel')}
      saveLabel={t('users.saveChanges')}
      onSave={handleSave}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={handleSave}>
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <ContactPicker
                  label={t('users.fieldContact')}
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? '')}
                  searchPlaceholder={t('users.contactSearch')}
                  emptyTitle={t('users.contactEmptyTitle')}
                  emptyHint={t('users.contactEmptyHint')}
                />
                <TranslatedFormMessage messageKey={form.formState.errors.contactId?.message} />
                {user.loginEmail ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t('users.fieldLoginEmail')}: {user.loginEmail}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">{t('users.loginEmailNote')}</p>
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
                  {workspaceRoles.map((workspaceRole) => (
                    <Button
                      key={workspaceRole.id}
                      type="button"
                      size="sm"
                      variant={field.value === workspaceRole.id ? 'default' : 'outline'}
                      onClick={() => field.onChange(workspaceRole.id)}
                    >
                      {workspaceRole.customLabel?.trim() || t(workspaceRole.labelKey)}
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
                  <FormSelect
                    id="edit-user-status"
                    name="edit-user-status"
                    value={field.value}
                    onChange={field.onChange}
                    options={USER_STATUS_VALUES.map((status) => ({
                      value: status,
                      label: t(`users.status.${status}`),
                    }))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="twoFactorEnabled"
            render={({ field }) => (
              <FormItem>
                <label htmlFor={field.name} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
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
