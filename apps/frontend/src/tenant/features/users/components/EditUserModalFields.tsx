import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  USER_STATUS_VALUES,
  type EditWorkspaceUserInput,
  type SystemUser,
  type WorkspaceRole,
  type ModuleCustomField,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import ContactPicker from '@/components/contactLink/ContactPicker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';
import { useTranslation } from '@/hooks/useTranslation';

export interface EditUserModalFieldsProps {
  form: UseFormReturn<EditWorkspaceUserInput & Record<string, unknown>>;
  user: SystemUser;
  canManageThisUser: boolean;
  assignableRoles: WorkspaceRole[];
  customFields: ModuleCustomField[];
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function EditUserModalFields({
  form,
  user,
  canManageThisUser,
  assignableRoles,
  customFields,
  onSubmit,
}: EditUserModalFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
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
  );
}
