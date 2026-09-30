import React, { useState } from "react";
import { PieChart } from "lucide-react";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormModal } from "@/components/ui/FormModal";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { DISTRIBUTION_TYPES, type ObligationDistribution } from "@/lib/data/obligationsData";
import { type DistributionType } from "@/tenant/features/obligations/components/WakalaTypeManager";
import { cn } from "@/lib/utils";

interface DistributionFormModalProps {
  title: string;
  initial: Partial<ObligationDistribution>;
  onSave: (form: Partial<ObligationDistribution>) => Promise<unknown> | void;
  onClose: () => void;
}

export function DistributionFormModal({ initial, onSave, onClose, title }: DistributionFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = t("obligations.mujtahids.nameRequired");
    if (!form.percentage || isNaN(Number(form.percentage)) || Number(form.percentage) <= 0 || Number(form.percentage) > 100) {
      nextErrors.pct = t("obligations.wakala.pctInvalid");
    }
    return nextErrors;
  };

  const handleSave = async (): Promise<void> => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setSubmitError("");
    setSaving(true);
    try {
      await onSave({ ...form, percentage: Number(form.percentage) });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t("obligations.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const errorMessages = [
    ...Object.values(errors),
    ...(submitError ? [submitError] : []),
  ];

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      icon={PieChart}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      saving={saving}
      saveDisabled={saving || !form.name?.trim() || !form.percentage}
      error={errorMessages.length > 0 ? errorMessages : undefined}
    >
      <div className="space-y-4 text-start">
        <div>
          <label htmlFor="dist-name" className={FORM_LABEL}>{t("obligations.wakala.distName")}<RequiredMark /></label>
          <Input
            id="dist-name"
            name="name"
            value={form.name || ""}
            onChange={(event) => {
              if (errors.name) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.name;
                  return next;
                });
              }
              setForm({ ...form, name: event.target.value });
            }}
            className={cn(FORM_INPUT, errors.name && FORM_INPUT_ERROR)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "dist-name-error" : undefined}
          />
          <FieldErrorMessage id="dist-name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="dist-type" className={FORM_LABEL}>{t("obligations.wakala.distType")}<RequiredMark /></label>
          <FormSelect
            id="dist-type"
            name="type"
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
            name="percentage"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={form.percentage === undefined || form.percentage === null ? "" : String(form.percentage)}
            onChange={(event) => {
              if (errors.pct) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.pct;
                  return next;
                });
              }
              const val = event.target.value;
              if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
                setForm({ ...form, percentage: val === "" ? ("" as unknown as number) : parseFloat(val) || 0 });
              }
            }}
            className={cn(FORM_INPUT, errors.pct && FORM_INPUT_ERROR)}
            aria-invalid={!!errors.pct}
            aria-describedby={errors.pct ? "dist-pct-error" : undefined}
          />
          <FieldErrorMessage id="dist-pct-error" message={errors.pct} />
        </div>
      </div>
    </FormModal>
  );
}

