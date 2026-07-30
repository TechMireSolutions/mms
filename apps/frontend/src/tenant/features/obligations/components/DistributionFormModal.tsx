import React, { useState } from "react";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { DISTRIBUTION_TYPES, type ObligationDistribution } from "@/lib/data/obligationsData";
import { type DistributionType } from "@/tenant/features/obligations/components/WakalaTypeManager";

interface DistributionFormModalProps {
  title: string;
  initial: Partial<ObligationDistribution>;
  onSave: (form: Partial<ObligationDistribution>) => void;
  onClose: () => void;
}

export function DistributionFormModal({ initial, onSave, onClose, title }: DistributionFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = t("obligations.mujtahids.nameRequired");
    if (!form.percentage || isNaN(Number(form.percentage)) || Number(form.percentage) <= 0 || Number(form.percentage) > 100) {
      nextErrors.pct = t("obligations.wakala.pctInvalid");
    }
    return nextErrors;
  };

  const handleSave = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    onSave({ ...form, percentage: Number(form.percentage) });
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      error={Object.values(errors)}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="dist-name" className={FORM_LABEL}>{t("obligations.wakala.distName")}<RequiredMark /></label>
          <Input
            id="dist-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="dist-type" className={FORM_LABEL}>{t("obligations.wakala.distType")}<RequiredMark /></label>
          <FormSelect
            id="dist-type"
            value={form.type || ""}
            onChange={(val) => setForm({ ...form, type: val as DistributionType })}
            options={DISTRIBUTION_TYPES.map((type) => ({
              value: type,
              label: type === "Income" ? t("obligations.distribution.income") : t("obligations.distribution.liability"),
            }))}
          />
        </div>
        <div>
          <label htmlFor="dist-pct" className={FORM_LABEL}>{t("obligations.wakala.distPct")}<RequiredMark /></label>
          <Input
            id="dist-pct"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={form.percentage || ""}
            onChange={(event) => setForm({ ...form, percentage: parseFloat(event.target.value) })}
            className={FORM_INPUT}
            aria-invalid={!!errors.pct}
          />
        </div>
      </div>
    </FormModal>
  );
}
