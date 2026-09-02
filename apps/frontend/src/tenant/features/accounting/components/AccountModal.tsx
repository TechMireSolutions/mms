import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES, ACCOUNT_TYPE_META, type Account, type AccountType } from '@/lib/data/accountingData';
import { useAccountingConfig } from '@/hooks/useStandardModuleConfig';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { accountRecordSchema, type AppTranslationKey } from '@mms/shared';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Field } from '@/components/ui/FormPrimitives';

import { mapZodFormErrors } from '@/lib/forms/mapZodFormErrors';

interface AccountModalProps {
  initial: Account | null;
  onSave: (account: Account) => void | Promise<void>;
  onClose: () => void;
  existingCodes: string[];
}

export function AccountModal({ initial, onSave, onClose, existingCodes }: AccountModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<Account>>(initial || { code: '', name: '', type: 'Asset', subtype: '', description: '', isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const type = form.type as AccountType;
  const subtypes = type ? (ACCOUNT_SUBTYPES[type] || []) : [];
  const { fields, orderedFields, isFieldEnabled } = useAccountingConfig();

  const saveAccount = async () => {
    const candidate = {
      ...form,
      id: isEdit ? form.id : `a${crypto.randomUUID()}`,
      code: form.code?.trim() ?? '',
      name: form.name?.trim() ?? '',
      type: form.type ?? 'Asset',
      subtype: form.subtype ?? '',
      description: form.description ?? '',
      isActive: form.isActive ?? true,
    };
    const parsed = accountRecordSchema.safeParse(candidate);
    const validationErrors = parsed.success
      ? {}
      : mapZodFormErrors(parsed.error, (message) => t(message as AppTranslationKey));

    if (!isEdit && existingCodes.includes(candidate.code)) {
      validationErrors.code = t('accounting.coa.validation.codeExists');
    }
    for (const field of orderedFields) {
      const candidateValue = (candidate as Record<string, unknown>)[field.id];
      if (fields[field.id]?.required && !String(candidateValue ?? '').trim()) {
        validationErrors[field.id] = t('common.formPleaseFixErrors');
      }
    }

    if (!parsed.success || Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSave(parsed.data as Account);
    } finally {
      setSubmitting(false);
    }
  };

  const errorMessages = (() => Object.values(errors).filter(Boolean))();

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? t('accounting.coa.editAccount') : t('accounting.coa.addAccount')}
      icon={BookOpen}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      onSave={saveAccount}
      saving={submitting}
      error={errorMessages}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {orderedFields.map((field) => {
          const isEnabled = isFieldEnabled(field.id);
          if (!isEnabled) return null;

          if (field.id === 'code') {
            return (
              <Field key="code" id="account-code" label={t('accounting.coa.fields.code')} required error={errors.code}>
                <Input id="account-code" name="code" value={form.code || ''} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder={t('accounting.coa.fields.codePlaceholder')} required />
              </Field>
            );
          }

          if (field.id === 'type') {
            return (
              <Field key="type" id="account-type" label={t('accounting.coa.fields.type')} required error={errors.type}>
                <FormSelect
                  id="account-type"
                  name="type"
                  value={form.type || 'Asset'}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, type: val as AccountType, subtype: '' }))
                  }
                  options={ACCOUNT_TYPES.map((accType) => ({ value: accType, label: t(`accounting.type.${accType}` as AppTranslationKey) }))}
                />
              </Field>
            );
          }

          if (field.id === 'name') {
            return (
              <div key="name" className="sm:col-span-2">
                <Field id="account-name" label={t('accounting.coa.fields.name')} required error={errors.name}>
                <Input id="account-name" name="name" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t('accounting.coa.fields.namePlaceholder')} required />
                </Field>
              </div>
            );
          }

          if (field.id === 'subtype') {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="subtype" className="sm:col-span-2">
                <Field id="account-subtype" label={t('accounting.coa.fields.subtype')} required={isRequired} error={errors.subtype}>
                  <FormSelect
                    id="account-subtype"
                    name="subtype"
                    value={form.subtype || ''}
                    onChange={(val) => setForm({ ...form, subtype: val })}
                    options={subtypes}
                    placeholder={t('accounting.journal.form.none')}
                  />
                </Field>
              </div>
            );
          }

          if (field.id === 'description') {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="description" className="sm:col-span-2">
                <Field id="account-description" label={t('accounting.coa.fields.description')} required={isRequired} error={errors.description}>
                  <Input id="account-description" name="description" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('accounting.coa.fields.descriptionPlaceholder')} required={isRequired} />
                </Field>
              </div>
            );
          }

          return null;
        })}
      </div>

      {type && ACCOUNT_TYPE_META[type] && (
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${ACCOUNT_TYPE_META[type].color}`} aria-live="polite">
          <span aria-hidden="true">{ACCOUNT_TYPE_META[type].icon}</span>
          <span>
            {t(`accounting.type.${type}` as AppTranslationKey)} · {t('accounting.columns.account.normalBalance')}: <strong>{ACCOUNT_TYPE_META[type].normalBalance === 'debit' ? t('accounting.ledger.dr') : t('accounting.ledger.cr')}</strong> · {t(`accounting.reports.views.${ACCOUNT_TYPE_META[type].group}` as AppTranslationKey)}
          </span>
        </div>
      )}
    </FormModal>
  );
}
