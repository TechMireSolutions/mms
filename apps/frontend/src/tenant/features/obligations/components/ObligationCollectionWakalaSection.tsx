import React from 'react';
import { User } from 'lucide-react';
import { type Mujtahid, type MujtahidRep, type ObligationType } from '@/lib/data/obligationsData';
import { type AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { UserActorSelect } from '@/components/ui/UserActorSelect';
import { SectionCard } from '@/components/ui/SectionCard';
import type { ObligationCollectionFormState } from './ObligationCollectionFormFields';

interface ObligationCollectionWakalaSectionProps {
  form: ObligationCollectionFormState;
  setForm: React.Dispatch<React.SetStateAction<ObligationCollectionFormState>>;
  errors: Partial<Record<keyof ObligationCollectionFormState, AppTranslationKey>>;
  obligationTypes: ObligationType[];
  eligibleReps: MujtahidRep[];
  getMujtahid: (repId: string) => Mujtahid | null | undefined;
  selectedMujtahid: Mujtahid | null | undefined;
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
  errors: _errors,
  obligationTypes,
  eligibleReps,
  getMujtahid,
  selectedMujtahid,
  formField,
}: ObligationCollectionWakalaSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard
      accentColor="primary"
      icon={User}
      title={t('obligations.form.section.wakala')}
      className="p-0 text-start"
    >
      <fieldset className="space-y-4 border-0 m-0 p-0 text-start">
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

          <UserActorSelect
            id="obligation-received-by"
            label={t('obligations.form.receivedBy')}
            required
            value={form.received_by}
            onChange={(value) => setForm({ ...form, received_by: value })}
          />
        </div>
      </fieldset>
    </SectionCard>
  );
}
