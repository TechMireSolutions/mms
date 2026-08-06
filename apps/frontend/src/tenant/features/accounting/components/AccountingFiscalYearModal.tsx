import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { FiscalYear } from "@/lib/data/accountingData";

interface AccountingFiscalYearModalProps {
  open: boolean;
  initial: Partial<FiscalYear> | null;
  onSave: (fiscalYear: FiscalYear) => void | Promise<void>;
  onClose: () => void;
}

const blankFiscalYear: Partial<FiscalYear> = {
  label: "",
  startDate: "",
  endDate: "",
  status: "upcoming",
};

export function AccountingFiscalYearModal({
  open,
  initial,
  onSave,
  onClose,
}: AccountingFiscalYearModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<FiscalYear>>(initial || blankFiscalYear);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initial || blankFiscalYear);
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const validationErrors: Record<string, string> = {};
    if (!form.label?.trim()) validationErrors.label = t("accounting.settings.fy.validation.label");
    if (!form.startDate) validationErrors.startDate = t("accounting.settings.fy.validation.startDate");
    if (!form.endDate) validationErrors.endDate = t("accounting.settings.fy.validation.endDate");
    if (form.startDate && form.endDate && form.startDate >= form.endDate) validationErrors.endDate = t("accounting.settings.fy.validation.endAfterStart");
    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        id: isEdit ? form.id : `fy${Date.now()}`,
      } as FiscalYear);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? t("accounting.settings.fy.editTitle") : t("accounting.settings.fy.newTitle")}
      icon={Calendar}
      error={Object.values(errors)}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => { void handleSave(); }}
      saving={submitting}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="financial-year-label" className={FORM_LABEL}>{t("accounting.settings.fy.labelField")}</label>
          <Input
            id="financial-year-label"
            value={form.label || ""}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder={t("accounting.settings.fy.labelPlaceholder")}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="financial-year-start" className={FORM_LABEL}>{t("accounting.settings.fy.startDateField")}</label>
            <DatePicker
              id="financial-year-start"
              name="startDate"
              value={form.startDate || ""}
              onChange={(startDateValue) => setForm({ ...form, startDate: startDateValue })}
              required
            />
          </div>
          <div>
            <label htmlFor="financial-year-end" className={FORM_LABEL}>{t("accounting.settings.fy.endDateField")}</label>
            <DatePicker
              id="financial-year-end"
              name="endDate"
              value={form.endDate || ""}
              onChange={(endDateValue) => setForm({ ...form, endDate: endDateValue })}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="financial-year-status" className={FORM_LABEL}>{t("accounting.settings.fy.status")}</label>
          <FormSelect
            id="financial-year-status"
            value={form.status || "upcoming"}
            onChange={(statusValue) => setForm({ ...form, status: statusValue as FiscalYear["status"] | "upcoming" })}
            options={[
              { value: "upcoming", label: t("accounting.settings.fy.status.upcoming") },
              { value: "active", label: t("accounting.settings.fy.status.active") },
              { value: "closed", label: t("accounting.settings.fy.status.closed") }
            ]}
          />
        </div>
      </div>
    </FormModal>
  );
}
