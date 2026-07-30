import React from 'react';
import { User } from 'lucide-react';
import { Mujtahid, MujtahidRep, ObligationType } from '@/lib/data/obligationsData';
import { type AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { Card } from '@/components/ui/card';
import type { ObligationCollectionFormState } from './ObligationCollectionFormFields';

interface ObligationCollectionWakalaSectionProps {
  form: ObligationCollectionFormState;
  setForm: React.Dispatch<React.SetStateAction<ObligationCollectionFormState>>;
  errors: Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>>;
  obligationTypes: ObligationType[];
  eligibleReps: MujtahidRep[];
  getMujtahid: (repId: string) => Mujtahid | null | undefined;
  selectedMujtahid: Mujtahid | null | undefined;
  users: Array<{ id: string; name: string }>;
  formField: (
    key: keyof ObligationCollectionFormState,
    label: string,
    required: boolean,
    children: React.ReactNode,
  ) => React.ReactElement;
}

export function ObligationCollectionWakalaSection({
  form,
  setForm,
  errors,
  obligationTypes,
  eligibleReps,
  getMujtahid,
  selectedMujtahid,
  users,
  formField,
}: ObligationCollectionWakalaSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card accentColor="primary" className="p-0">
      <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
          <User className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('obligations.form.section.wakala')}</h3>
        </div>
        <div className="space-y-4">
          {formField('obligation_type_id', t('obligations.form.obligationType'), true,
            <FormSelect
              value={form.obligation_type_id}
              onChange={(val) => setForm({ ...form, obligation_type_id: val })}
              placeholder={t('obligations.form.selectType')}
              options={obligationTypes.map((obligationType) => ({
                value: obligationType.id,
                label: `${obligationType.name} (${obligationType.designated_for})`,
              }))}
              className="w-full"
            />,
          )}

          {formField('mujtahid_representative_id', t('obligations.form.representative'), true,
            <div className="space-y-1 w-full">
              <FormSelect
                value={form.mujtahid_representative_id}
                onChange={(val) => setForm({ ...form, mujtahid_representative_id: val })}
                disabled={!form.obligation_type_id}
                placeholder={form.obligation_type_id ? t('obligations.form.selectRep') : t('obligations.form.selectTypeFirst')}
                options={eligibleReps.map((rep) => {
                  const mujtahid = getMujtahid(rep.id);
                  return {
                    value: rep.id,
                    label: `${rep.name}${mujtahid ? ` (${mujtahid.name})` : ''}`,
                  };
                })}
                className="w-full"
              />
              {selectedMujtahid && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('obligations.form.mujtahidLabel')}: <span className="font-semibold text-foreground">{selectedMujtahid.name}</span>
                </p>
              )}
            </div>,
          )}

          {formField('received_by', t('obligations.form.receivedBy'), true,
            <FormSelect
              value={form.received_by}
              onChange={(val) => setForm({ ...form, received_by: val })}
              placeholder={t('obligations.form.selectUser')}
              options={users.map((user) => ({ value: user.id, label: user.name }))}
              className="w-full"
            />,
          )}
        </div>
      </fieldset>
    </Card>
  );
}
