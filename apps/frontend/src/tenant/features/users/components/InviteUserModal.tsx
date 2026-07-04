import React, { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { USER_STATUS_VALUES, toTitleCase, type SystemUser } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useContactById } from '@/tenant/features/contacts/hooks/useContacts';
import { FormModal } from '@/components/ui/FormModal';
import ContactPicker from '@/tenant/features/contacts/components/contactLink/ContactPicker';
import { Button } from '@/components/ui/button';
import { FORM_SELECT, FORM_CHECKBOX } from '@/components/ui/formStyles';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { inviteUserSchema, type InviteUserFormValues } from '@/lib/forms/userSchemas';
import { firstZodFieldError } from '@/lib/forms/translateZodError';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';

export interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (user: SystemUser) => void;
  existingContactIds?: (string | number)[];
}

export function InviteUserModal({
  onClose,
  onInvite,
  existingContactIds = [],
}: InviteUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();

  const excludeIds = useMemo(
    () => existingContactIds.map(String),
    [existingContactIds],
  );

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      contactId: '',
      role: '',
      status: 'inactive',
      sendEmail: true,
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
    const email = ((contact.email as string | undefined) || contact.emails?.[0]?.address || '').trim().toLowerCase();
    const phone = ((contact.phone as string | undefined) || contact.phones?.[0]?.number || '').trim();
    const user: SystemUser = {
      id: `u${Date.now()}`,
      contactId: contact.id,
      name,
      email,
      phone,
      role: values.role,
      status: values.status,
      avatarInitials: name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      lastLogin: '',
      createdDate: new Date().toISOString().slice(0, 10),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      activeSessions: 0,
    };
    onInvite(user);
    onClose();
  });

  return (
    <FormModal
      open
      onClose={onClose}
      title={t('users.inviteTitle')}
      subtitle={t('users.inviteSubtitle')}
      icon={UserPlus}
      error={firstZodFieldError(form.formState.errors, t) || undefined}
      cancelLabel={t('users.cancel')}
      saveLabel={t('users.inviteSubmit')}
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
                  excludeIds={excludeIds}
                  onChange={(id) => field.onChange(id ?? '')}
                  searchPlaceholder={t('users.contactSearch')}
                  emptyTitle={t('users.contactEmptyTitle')}
                  emptyHint={t('users.contactEmptyHint')}
                />
                <TranslatedFormMessage messageKey={form.formState.errors.contactId?.message} />
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
                <FormLabel htmlFor="invite-status">{t('users.fieldStatus')}</FormLabel>
                <FormControl>
                  <select
                    id="invite-status"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value as SystemUser['status'])}
                    className={FORM_SELECT}
                  >
                    {USER_STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {t(`users.status.${status}`)}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sendEmail"
            render={({ field }) => (
              <FormItem>
                <label htmlFor={field.name} className="flex cursor-pointer items-center gap-2">
                  <input
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className={FORM_CHECKBOX}
                  />
                  <span className="text-xs font-medium text-foreground">{t('users.inviteSendEmail')}</span>
                </label>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormModal>
  );
}
