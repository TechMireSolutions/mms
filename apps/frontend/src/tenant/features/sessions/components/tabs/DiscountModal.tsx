import React, { useState } from "react";
import { Tag } from "lucide-react";
import { type Discount } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";

const EMPTY: Partial<Discount> = { name: "", type: "percentage", value: 0, conditions: "", active: true };

export interface DiscountModalProps {
  open: boolean;
  discount: Discount | null;
  onClose: () => void;
  onSave: (discount: Discount) => void | Promise<void>;
  saving: boolean;
}

export function DiscountModal({ open, discount, onClose, onSave, saving }: DiscountModalProps) {
  const { t } = useTranslation();
  const [discountDraft, setDiscountDraft] = useState<Partial<Discount>>(discount ? { ...discount } : { ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateDiscountDraft = <K extends keyof Discount>(field: K, value: Discount[K]) => setDiscountDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setDiscountDraft(discount ? { ...discount } : { ...EMPTY });
      setErrors({});
    }
  }, [open, discount]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!discountDraft.name?.trim()) {
      newErrors.name = t("common.formPleaseFixErrors");
    }
    const numValue = Number(discountDraft.value);
    if (Number.isNaN(numValue) || numValue < 0 || (discountDraft.type === "percentage" && numValue > 100)) {
      newErrors.value = t("common.formPleaseFixErrors");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({ ...discountDraft, id: discount?.id || `d${crypto.randomUUID()}` } as Discount);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={discount ? t("sessions.discounts.edit") : t("sessions.discounts.add")}
      icon={Tag}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      error={Object.values(errors)[0]}
      saveDisabled={!discountDraft.name?.trim()}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="discount-name">{t("sessions.discounts.form.name")}<RequiredMark /></label>
          <Input
            id="discount-name"
            name="name"
            value={discountDraft.name || ""}
            onChange={(event) => updateDiscountDraft("name", event.target.value)}
            placeholder={t("sessions.discounts.form.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "discount-name-error" : undefined}
            className={errors.name ? FORM_INPUT_ERROR : undefined}
            required
          />
          <FieldErrorMessage id="discount-name-error" message={errors.name} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="discount-type">{t("sessions.discounts.form.type")}</label>
            <FormSelect
              id="discount-type"
              name="type"
              value={discountDraft.type || "percentage"}
              onChange={(value) => updateDiscountDraft("type", value as Discount["type"])}
              options={[
                { value: "percentage", label: t("sessions.discounts.type.percentage") },
                { value: "fixed", label: t("sessions.discounts.type.fixed") },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="discount-value">{t("sessions.discounts.form.value")}</label>
            <Input
              id="discount-value"
              name="value"
              type="number"
              value={discountDraft.value ?? 0}
              onChange={(event) => updateDiscountDraft("value", +event.target.value)}
              min={0}
              max={discountDraft.type === "percentage" ? 100 : undefined}
              aria-invalid={Boolean(errors.value)}
              aria-describedby={errors.value ? "discount-value-error" : undefined}
              className={errors.value ? FORM_INPUT_ERROR : undefined}
              required
            />
            <FieldErrorMessage id="discount-value-error" message={errors.value} />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="discount-conditions">{t("sessions.discounts.form.conditions")}</label>
          <Textarea id="discount-conditions" name="conditions" className="min-h-textarea-md resize-none" value={discountDraft.conditions || ""} onChange={(event) => updateDiscountDraft("conditions", event.target.value)} placeholder={t("sessions.discounts.form.conditionsPlaceholder")} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={discountDraft.active || false} onCheckedChange={(checked) => updateDiscountDraft("active", !!checked)} />
          <span className="text-sm text-foreground font-medium">{t("sessions.discounts.active")}</span>
        </label>
      </div>
    </FormModal>
  );
}
