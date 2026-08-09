import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Denomination, StockBatch } from '@/lib/data/hasanatData';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormModal } from '@/components/ui/FormModal';
import { RequiredMark } from '@/components/ui/FormPrimitives';
import { UserActorSelect } from '@/components/ui/UserActorSelect';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { todayISO } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

interface StockAddBatchModalProps {
  open: boolean;
  denoms: Denomination[];
  onClose: () => void;
  onSave: (batch: StockBatch) => void | Promise<void>;
}

export function StockAddBatchModal({ open, denoms, onClose, onSave }: StockAddBatchModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<Partial<StockBatch>>({
    denominationId: denoms[0]?.id || '',
    quantity: 0,
    addedDate: todayISO(),
    addedByUserId: '',
    note: '',
  });

  const updateField = <K extends keyof StockBatch>(field: K, value: StockBatch[K]) =>
    setData((previousData: Partial<StockBatch>) => ({ ...previousData, [field]: value }));
  const selectedDenomination = denoms.find((denomination) => denomination.id === data.denominationId);

  React.useEffect(() => {
    if (open) {
      setData({
        denominationId: denoms[0]?.id || '',
        quantity: 0,
        addedDate: todayISO(),
        addedByUserId: '',
        note: '',
      });
    }
  }, [open, denoms]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t('hasanat.stock.addBatchTitle')}
      icon={Package}
      cancelLabel={t('common.cancel')}
      saveLabel={t('hasanat.stock.addBatchAction')}
      saving={submitting}
      onSave={() => {
        void (async () => {
          const denomination = denoms.find((candidate) => candidate.id === data.denominationId);
          setSubmitting(true);
          try {
            await onSave({
              ...data,
              id: `bat${crypto.randomUUID()}`,
              quantity: Number(data.quantity),
              remaining: Number(data.quantity),
              denominationName: denomination?.name || '',
            } as StockBatch);
          } finally {
            setSubmitting(false);
          }
        })();
      }}
      saveDisabled={!data.denominationId || !data.quantity}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="denom" className={FORM_LABEL}>{t('hasanat.form.denomination')}<RequiredMark /></label>
          <FormSelect
            id="denom"
            value={data.denominationId || ''}
            onChange={(value) => updateField('denominationId', value)}
            options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
              value: denomination.id,
              label: `${denomination.icon} ${denomination.name} (${t('hasanat.form.pointsShort', { points: denomination.points })})`,
            }))}
          />
        </div>
        {selectedDenomination && (
          <div className="h-10 rounded-xl flex items-center gap-2 px-3 text-white text-sm font-semibold" style={{ background: selectedDenomination.color }}>
            <span aria-hidden="true">{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="qty" className={FORM_LABEL}>{t('hasanat.form.quantity')}<RequiredMark /></label>
            <Input id="qty" type="number" className={FORM_INPUT} value={data.quantity || ''} onChange={(event) => updateField('quantity', Number(event.target.value))} placeholder="0" min={1} />
          </div>
          <div>
            <label htmlFor="add-date" className={FORM_LABEL}>{t('hasanat.stock.date')}</label>
            <DatePicker id="add-date" name="addedDate" value={data.addedDate || ''} onChange={(value) => updateField('addedDate', value)} />
          </div>
        </div>
        <UserActorSelect
          id="added-by"
          label={t('hasanat.stock.addedBy')}
          value={data.addedByUserId || ''}
          onChange={(id) => updateField('addedByUserId', id)}
          allowEmpty
        />
        <div>
          <label htmlFor="note" className={FORM_LABEL}>{t('hasanat.stock.note')}</label>
          <Input id="note" className={FORM_INPUT} value={data.note} onChange={(event) => updateField('note', event.target.value)} placeholder={t('hasanat.stock.notePlaceholder')} />
        </div>
      </div>
    </FormModal>
  );
}
