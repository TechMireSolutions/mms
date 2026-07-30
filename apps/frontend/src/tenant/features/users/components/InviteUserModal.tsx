import React, { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  USER_STATUS_VALUES,
  inviteWorkspaceUserSchema,
  toTitleCase,
  type InviteWorkspaceUserInput,
  type SystemUser,
  getInitials,
  todayISO,
  getPrimaryEmail,
  getPrimaryPhone,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useContactById } from '@/tenant/hooks/collections/contacts';
import { FormModal } from '@/components/ui/FormModal';
import ContactPicker from '@/components/contactLink/ContactPicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/FormSelect';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { firstZodFieldError } from '@/lib/forms/translateZodError';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';
import { notify } from '@/lib/notify';

export interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (user: SystemUser) => void | Promise<void>;
  existingContactIds?: (string | number)[];
}

export function InviteUserModal({
  onClose,
  onInvite,
  existingContactIds = [],
}: InviteUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const [submitting, setSubmitting] = useState(false);

  const excludeIds = useMemo(
    () => existingContactIds.map(String),
    [existingContactIds],
  );

  const form = useForm<InviteWorkspaceUserInput>({
    resolver: zodResolver(inviteWorkspaceUserSchema),
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

  const handleSave = form.handleSubmit(async (values) => {
    const contact = selectedContact;
    if (!contact) return;
    const name = toTitleCase(contact.name.trim()) as string;
    const email = (getPrimaryEmail(contact) || '').toLowerCase();
    const phone = getPrimaryPhone(contact) || '';
    const user: SystemUser = {
      id: `u${Date.now()}`,
      contactId: contact.id,
      name,
      email,
      phone,
      role: values.role,
      status: values.status,
      avatarInitials: getInitials(name),
      lastLogin: '',
      createdDate: todayISO(),
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      activeSessions: 0,
    };
    setSubmitting(true);
    try {
      await onInvite(user);
      onClose();
    } catch (error: unknown) {
      notify.error(t('errors.module.title'), {
        description: error instanceof Error ? error.message : t('errors.module.description'),
      });
    } finally {
      setSubmitting(false);
    }
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
      saving={submitting}
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
                  <FormSelect
                    id="invite-status"
                    name="invite-status"
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
            name="sendEmail"
            render={({ field }) => (
              <FormItem>
                <label htmlFor={field.name} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
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
