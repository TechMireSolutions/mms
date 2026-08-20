import React from 'react';
import { Receipt, Coins, DollarSign, Users } from 'lucide-react';
import { PAYMENT_MODES, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES, type AppTranslationKey } from '@mms/shared';
import ContactPicker from '@/components/contactLink/ContactPicker';
import { useTranslation } from '@/hooks/useTranslation';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Field } from '@/components/ui/FormPrimitives';
import { Card } from '@/components/ui/card';
import { ObligationCollectionWakalaSection } from '@/tenant/features/obligations/components/ObligationCollectionWakalaSection';
import { cn } from '@/lib/utils';
import { CARD_STRIPE_WIDTH } from '@/lib/semanticTone';

export interface ObligationCollectionFormState {
  receipt_no: string;
  received_date: string;
  sender_id: string;
  reference_id: string;
  amount: string;
  currency_id: string;
  payment_mode: string;
  obligation_type_id: string;
  mujtahid_representative_id: string;
  received_by: string;
}

export interface ObligationCollectionFormFieldsProps {
  form: ObligationCollectionFormState;
  setForm: React.Dispatch<React.SetStateAction<ObligationCollectionFormState>>;
  errors: Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>>;
  obligationTypes: ObligationType[];
  eligibleReps: MujtahidRep[];
  getMujtahid: (repId: string) => Mujtahid | null | undefined;
  selectedMujtahid: Mujtahid | null | undefined;
  users: Array<{ id: string; name: string }>;
}

export function ObligationCollectionFormFields({
  form,
  setForm,
  errors,
  obligationTypes,
  eligibleReps,
  getMujtahid,
  selectedMujtahid,
  users,
}: ObligationCollectionFormFieldsProps): React.ReactElement {
  const { t } = useTranslation();
  const currencies = DEFAULT_CURRENCIES;

  const formField = (key: keyof ObligationCollectionFormState, label: string, required: boolean, children: React.ReactNode) => (
    <Field id={`form-${key}`} label={label} required={required} error={errors[key] ? t(errors[key]!) : undefined}>
      {children}
    </Field>
  );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden group rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-sm p-4 px-5.5 flex items-center gap-3.5 shadow-sm transition-all duration-300">
        <div className={cn("absolute start-0 top-0 bottom-0 bg-primary/70", CARD_STRIPE_WIDTH)} />
        <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{t('obligations.form.receiptAuto')}</h3>
          <p className="text-lg font-bold text-primary font-mono m-0">{form.receipt_no}</p>
        </div>
      </header>

      <Card accentColor="primary" className="p-0">
        <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Receipt className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('obligations.form.section.metadata')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField('received_date', t('obligations.form.receivedDate'), true,
              <DatePicker
                id="received_date"
                name="received_date"
                value={form.received_date}
                onChange={(val) => setForm({ ...form, received_date: val })}
                required
              />,
            )}
            {formField('payment_mode', t('obligations.form.paymentMode'), true,
              <FormSelect
                value={form.payment_mode}
                onChange={(val) => setForm({ ...form, payment_mode: val })}
                options={PAYMENT_MODES.map((mode) => ({
                  value: mode,
                  label: mode === 'Cash' ? t('obligations.paymentMode.cash') : t('obligations.paymentMode.online'),
                }))}
                className="w-full"
              />,
            )}
          </div>
        </fieldset>
      </Card>

      <Card accentColor="primary" className="p-0 z-20">
        <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Users className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('obligations.form.section.sender')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField('sender_id', t('obligations.form.sender'), true,
              <ContactPicker
                label={t('obligations.form.sender')}
                value={form.sender_id || null}
                onChange={(contactId) => setForm({ ...form, sender_id: contactId != null ? String(contactId) : '' })}
                searchPlaceholder={t('contacts.picker.searchPlaceholder')}
              />,
            )}
            {formField('reference_id', t('obligations.form.reference'), false,
              <ContactPicker
                label={t('obligations.form.reference')}
                value={form.reference_id || null}
                onChange={(contactId) => setForm({ ...form, reference_id: contactId != null ? String(contactId) : '' })}
                allowCreate={false}
                searchPlaceholder={t('contacts.picker.searchPlaceholder')}
              />,
            )}
          </div>
        </fieldset>
      </Card>

      <Card accentColor="primary" className="p-0 z-10">
        <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <Coins className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('obligations.form.section.financial')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField('amount', t('obligations.form.amount'), true,
              <div className="relative flex items-center group/input w-full">
                <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none z-10" />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="0.00"
                  className="ps-10 w-full"
                />
              </div>,
            )}
            {formField('currency_id', t('obligations.form.currency'), true,
              <FormSelect
                value={form.currency_id}
                onChange={(val) => setForm({ ...form, currency_id: val })}
                options={currencies.map((currency) => ({ value: currency.id, label: `${currency.code} – ${currency.name}` }))}
                className="w-full"
              />,
            )}
          </div>
        </fieldset>
      </Card>

      <ObligationCollectionWakalaSection
        form={form}
        setForm={setForm}
        errors={errors}
        obligationTypes={obligationTypes}
        eligibleReps={eligibleReps}
        getMujtahid={getMujtahid}
        selectedMujtahid={selectedMujtahid}
        users={users}
        formField={formField}
      />
    </div>
  );
}
