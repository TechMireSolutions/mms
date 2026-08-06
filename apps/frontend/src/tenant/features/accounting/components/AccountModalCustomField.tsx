import React from 'react';
import { RegistryDateField } from '@/components/ui/RegistryDateField';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FORM_LABEL } from '@/components/ui/formStyles';
import type { ModuleFieldDef } from '@mms/shared';
import type { Account } from '@/lib/data/accountingData';

interface AccountModalCustomFieldProps {
  field: ModuleFieldDef;
  form: Partial<Account>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Account>>>;
}

export function AccountModalCustomField({
  field,
  form,
  setForm,
}: AccountModalCustomFieldProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const value = (form as Record<string, unknown>)[field.id] ?? '';

  return (
    <div className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label className={FORM_LABEL}>
        {field.label} {field.required ? '*' : ''}
      </label>
      {field.type === 'textarea' ? (
        <Textarea
          id={`account-${field.id}`}
          name={field.id}
          value={value as string}
          onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
          placeholder={field.placeholder || t('accounting.coa.fields.enterPlaceholder', { label: field.label })}
          required={field.required}
        />
      ) : field.type === 'select' ? (
        <FormSelect
          id={`account-${field.id}`}
          name={field.id}
          value={value as string}
          onChange={(val) => setForm((previousForm) => ({ ...previousForm, [field.id]: val }))}
          options={field.options || []}
          placeholder={t('accounting.journal.form.none')}
        />
      ) : field.type === 'boolean' ? (
        <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
          <Checkbox
            id={`account-${field.id}`}
            name={field.id}
            checked={!!value}
            onCheckedChange={(checked) => setForm((previousForm) => ({ ...previousForm, [field.id]: !!checked }))}
          />
          <span className="text-xs font-medium text-foreground">{field.label}</span>
        </label>
      ) : field.type === 'number' ? (
        <Input
          id={`account-${field.id}`}
          name={field.id}
          type="number"
          value={value as number}
          onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
          placeholder={field.placeholder || t('accounting.coa.fields.enterNumber')}
          required={field.required}
        />
      ) : field.type === 'date' ? (
        <RegistryDateField
          id={`account-${field.id}`}
          name={field.id}
          value={value as string}
          onChange={(dateValue) => setForm((previousForm) => ({ ...previousForm, [field.id]: dateValue }))}
          required={field.required}
        />
      ) : (
        <Input
          id={`account-${field.id}`}
          name={field.id}
          type="text"
          value={value as string}
          onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
          placeholder={field.placeholder || t('accounting.coa.fields.enterPlaceholder', { label: field.label })}
          required={field.required}
        />
      )}
    </div>
  );
}
