import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  USER_STATUS_VALUES,
  canManageTargetUser,
  editWorkspaceUserSchema,
  filterAssignableRoles,
  toTitleCase,
  type EditWorkspaceUserInput,
  type SystemUser,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWorkspaceRoles } from '@/tenant/hooks/useWorkspaceRoles';
import { useContactById } from '@/tenant/hooks/collections/contacts';
import { FormModal } from '@/components/ui/FormModal';
import ContactPicker from '@/components/contactLink/ContactPicker';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useUsersConfig } from '@/hooks/useStandardModuleConfig';
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

export interface EditUserModalProps {
  user: SystemUser;
  onClose: () => void;
  onSave: (user: SystemUser) => void | Promise<void>;
}

export function EditUserModal({ user, onClose, onSave }: EditUserModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const workspaceRoles = useWorkspaceRoles();
  const { customFields } = useUsersConfig();
  const canManageThisUser = canManageTargetUser(authUser?.role, user.role);
  const assignableRoles = useMemo(
    () => filterAssignableRoles(workspaceRoles, authUser?.role),
    [workspaceRoles, authUser?.role],
  );
  const initialContactId = user.contactId ?? '';
  const [submitting, setSubmitting] = useState(false);

  const buildDefaultValues = () => ({
    contactId: user.contactId ?? '',
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    ...Object.fromEntries(
      customFields.map((cf) => [cf.id, (user as unknown as Record<string, unknown>)[cf.id] ?? cf.defaultValue ?? '']),
    ),
  });

  const form = useForm<EditWorkspaceUserInput & Record<string, unknown>>({
    resolver: zodResolver(editWorkspaceUserSchema),
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    form.reset(buildDefaultValues());
  }, [user.id, user.contactId, user.role, user.status, user.twoFactorEnabled, customFields, form]);

  const watchedContactId = form.watch('contactId');
  const { data: selectedContact, isLoading: isLoadingContact } = useContactById(
    watchedContactId ? String(watchedContactId) : undefined,
    Boolean(watchedContactId),
  );

  const handleSave = form.handleSubmit(async (values) => {
    const contact = selectedContact;
    if (!contact && watchedContactId) return;

    const name = contact ? (toTitleCase(contact.name.trim()) as string) : user.name;
    const email = contact ? (getPrimaryEmail(contact) || '').toLowerCase() : user.email;
    const phone = contact ? (getPrimaryPhone(contact) || '') : (user.phone || '');
    const customFieldValues = Object.fromEntries(
      customFields.map((cf) => [cf.id, values[cf.id] ?? (user as unknown as Record<string, unknown>)[cf.id] ?? '']),
    );

    setSubmitting(true);
    try {
      await onSave({
        ...user,
        contactId: contact?.id || user.contactId,
        name,
        email,
        phone,
        role: values.role,
        status: values.status,
        twoFactorEnabled: values.twoFactorEnabled,
        avatarInitials: getInitials(name),
        ...customFieldValues,
      });
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
      title={t('users.editTitle')}
      subtitle={selectedContact?.name || user.name}
      icon={User}
      error={firstZodFieldError(form.formState.errors, t) || undefined}
      cancelLabel={t('users.cancel')}
      saveLabel={t('users.saveChanges')}
      onSave={() => { void handleSave(); }}
      saving={submitting}
      saveDisabled={!canManageThisUser || !watchedContactId || isLoadingContact || !form.formState.isDirty}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={handleSave}>
          {!canManageThisUser && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {t('users.errors.cannotModifySuperAdmin')}
            </div>
          )}
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('users.fieldLoginEmail')}: {user.loginEmail}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{t('users.loginEmailNote')}</p>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.fieldRole')}</FormLabel>
                <div role="group" aria-label={t('users.fieldRole')} className="mt-1.5 flex flex-wrap gap-2">
                  {assignableRoles.map((workspaceRole) => (
                    <Button
                      key={workspaceRole.id}
                      type="button"
                      size="sm"
                      disabled={!canManageThisUser}
                      aria-pressed={field.value === workspaceRole.id}
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
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel htmlFor={field.name} className="cursor-pointer text-xs font-medium text-foreground">
                  {t('users.field2fa')}
                </FormLabel>
              </FormItem>
            )}
          />
          {customFields.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <p className="text-xs font-bold text-foreground">{t('customFields.title')}</p>
              {customFields.map((cf) => (
                <FormField
                  key={cf.id}
                  control={form.control}
                  name={cf.id}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor={`custom-field-${cf.id}`}>{cf.label}</FormLabel>
                      <FormControl>
                        <Input
                          id={`custom-field-${cf.id}`}
                          value={String(field.value ?? '')}
                          onChange={field.onChange}
                          placeholder={cf.placeholder || cf.label}
                        />
                      </FormControl>
                      <TranslatedFormMessage messageKey={form.formState.errors[cf.id]?.message as string} />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          )}
        </form>
      </Form>
    </FormModal>
  );
}
