import { useMemo, useState } from "react";
import { DESIGNATED_FOR_OPTIONS } from '@/lib/data/obligationsData';
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import type { AppTranslationKey } from "@mms/shared";
import type { ObligationType } from '@/lib/data/obligationsData';
import { DESIGNATED_LABEL_KEYS, type DesignatedFor } from "@/tenant/features/obligations/components/obligationTypeManagerShared";

interface ObligationTypeFormModalProps {
  title: string;
  initial: Partial<ObligationType>;
  onSave: (form: Partial<ObligationType>) => void;
  onClose: () => void;
}

export function ObligationTypeFormModal({ initial, onSave, onClose, title }: ObligationTypeFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Partial<Record<"name", AppTranslationKey>>>({});

  const designatedOptions = useMemo(
    () => DESIGNATED_FOR_OPTIONS.map((option) => ({
      value: option,
      label: t(DESIGNATED_LABEL_KEYS[option as DesignatedFor]),
    })),
    [t],
  );

  const validate = (): Partial<Record<"name", AppTranslationKey>> => {
    const nextErrors: Partial<Record<"name", AppTranslationKey>> = {};
    if (!form.name?.trim()) nextErrors.name = "obligations.types.nameRequired";
    return nextErrors;
  };

  const handleSave = (): void => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    onSave(form);
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      error={Object.values(errors).map((key) => t(key))}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="type-name" className={FORM_LABEL}>{t("obligations.types.colName")} *</label>
          <Input
            id="type-name"
            value={form.name || ""}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={FORM_INPUT}
            aria-invalid={!!errors.name}
          />
        </div>
        <div>
          <label htmlFor="type-designated" className={FORM_LABEL}>{t("obligations.types.colDesignated")} *</label>
          <FormSelect
            id="type-designated"
            value={form.designated_for || ""}
            onChange={(val) => setForm({ ...form, designated_for: val as DesignatedFor })}
            options={designatedOptions}
          />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="qty"
            checked={form.quantity_based}
            onCheckedChange={(checked) => setForm({ ...form, quantity_based: !!checked })}
          />
          <label htmlFor="qty" className="text-sm font-medium text-foreground cursor-pointer select-none">{t("obligations.types.colQuantity")}</label>
        </div>
      </div>
    </FormModal>
  );
}
