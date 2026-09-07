import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { type Denomination, type StockBatch } from '@/lib/data/hasanatData';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormModal } from '@/components/ui/FormModal';
import { FieldErrorMessage, RequiredMark } from '@/components/ui/FormPrimitives';
import { UserActorSelect } from '@/components/ui/UserActorSelect';
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { todayISO } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface StockAddBatchModalProps {
  open: boolean;
  denoms: Denomination[];
  onClose: () => void;
  onSave: (batch: StockBatch) => void | Promise<void>;
}

export function StockAddBatchModal({ open, denoms, onClose, onSave }: StockAddBatchModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<Partial<StockBatch>>({
    denominationId: denoms[0]?.id || '',
    quantity: 0,
    addedDate: todayISO(),
    addedByUserId: '',
    note: '',
  });

  const updateField = <K extends keyof StockBatch>(field: K, value: StockBatch[K]) => {
    setData((previousData: Partial<StockBatch>) => ({ ...previousData, [field]: value }));
    if (errors[field as string]) {
      setErrors((previousErrors) => {
        const next = { ...previousErrors };
        delete next[field as string];
        return next;
      });
    }
  };

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
      setErrors({});
      setSubmitError(null);
    }
  }, [open, denoms]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!data.denominationId) {
      newErrors.denominationId = t('common.required');
    }
    if (!data.quantity || Number(data.quantity) < 1) {
      newErrors.quantity = t('common.required');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError(t('common.formPleaseFixErrors'));
      return;
    }

    setSubmitError(null);
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
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t('hasanat.stock.addBatchTitle')}
      icon={Package}
      cancelLabel={t('common.cancel')}
      saveLabel={t('hasanat.stock.addBatchAction')}
      saving={submitting}
      error={submitError || undefined}
      onSave={handleSave}
      saveDisabled={denoms.length === 0}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="batch-denom" className={FORM_LABEL}>{t('hasanat.form.denomination')}<RequiredMark /></label>
          <FormSelect
            id="batch-denom"
            name="denominationId"
            value={data.denominationId || ''}
            onChange={(value) => updateField('denominationId', value)}
            aria-invalid={Boolean(errors.denominationId)}
            aria-describedby={errors.denominationId ? "batch-denom-error" : undefined}
            className={errors.denominationId ? FORM_INPUT_ERROR : undefined}
            options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
              value: denomination.id,
              label: `${denomination.icon} ${denomination.name} (${t('hasanat.form.pointsShort', { points: denomination.points })})`,
            }))}
          />
          <FieldErrorMessage id="batch-denom-error" message={errors.denominationId} />
        </div>
        {selectedDenomination && (
          <div className="h-10 rounded-xl flex items-center gap-2 px-3 text-white text-sm font-semibold" style={{ background: selectedDenomination.color }}>
            <span aria-hidden="true">{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="batch-qty" className={FORM_LABEL}>{t('hasanat.form.quantity')}<RequiredMark /></label>
            <Input
              id="batch-qty"
              name="quantity"
              type="number"
              inputMode="numeric"
              className={cn(FORM_INPUT, errors.quantity && FORM_INPUT_ERROR)}
              value={data.quantity || ''}
              onChange={(event) => updateField('quantity', Number(event.target.value))}
              placeholder="0"
              min={1}
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? "batch-qty-error" : undefined}
            />
            <FieldErrorMessage id="batch-qty-error" message={errors.quantity} />
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
          <label htmlFor="batch-note" className={FORM_LABEL}>{t('hasanat.stock.note')}</label>
          <Input id="batch-note" name="note" className={FORM_INPUT} value={data.note} onChange={(event) => updateField('note', event.target.value)} placeholder={t('hasanat.stock.notePlaceholder')} />
        </div>
      </div>
    </FormModal>
  );
}
