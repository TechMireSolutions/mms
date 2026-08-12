import React from 'react';
import { CustomFieldInput } from '@/components/ui/FormCustomFieldInput';
import { Field } from '@/components/ui/FormPrimitives';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
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
  const fieldId = `account-${field.id}`;

  // Boolean fields render inline with label (checkbox UX).
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
        <Checkbox
          id={fieldId}
          name={field.id}
          checked={!!value}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, [field.id]: !!checked }))}
        />
        <span className="text-xs font-medium text-foreground">{field.label}</span>
      </label>
    );
  }

  // Adapt ModuleFieldDef → shape CustomFieldInput accepts.
  const adaptedField = {
    key: field.id,
    label: field.label,
    type: (field.type || 'text') as any,
    required: field.required,
    options: field.options,
    placeholder: field.placeholder || t('accounting.coa.fields.enterPlaceholder', { label: field.label }),
    defaultValue: field.defaultValue,
  };

  return (
    <div className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <Field id={fieldId} label={`${field.label}${field.required ? ' *' : ''}`} required={field.required}>
        <CustomFieldInput
          field={adaptedField as any}
          value={value}
          onChange={(val) => setForm((prev) => ({ ...prev, [field.id]: val }))}
        />
      </Field>
    </div>
  );
}