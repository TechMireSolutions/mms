import React, { useState } from "react";
import { Tag } from "lucide-react";
import { Discount } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_LABEL } from "@/components/ui/formStyles";
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
  const updateDiscountDraft = <K extends keyof Discount>(field: K, value: Discount[K]) => setDiscountDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setDiscountDraft(discount ? { ...discount } : { ...EMPTY });
    }
  }, [open, discount]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={discount ? t("sessions.discounts.edit") : t("sessions.discounts.add")}
      icon={Tag}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => onSave({ ...discountDraft, id: discount?.id || `d${crypto.randomUUID()}` } as Discount)}
      saveDisabled={!discountDraft.name}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="discount-name">{t("sessions.discounts.form.name")}<RequiredMark /></label>
          <Input id="discount-name" value={discountDraft.name || ""} onChange={(event) => updateDiscountDraft("name", event.target.value)} placeholder={t("sessions.discounts.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="discount-type">{t("sessions.discounts.form.type")}</label>
            <FormSelect
              id="discount-type"
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
            <Input id="discount-value" type="number" value={discountDraft.value || 0} onChange={(event) => updateDiscountDraft("value", +event.target.value)} min={0} max={discountDraft.type === "percentage" ? 100 : undefined} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="discount-conditions">{t("sessions.discounts.form.conditions")}</label>
          <Textarea id="discount-conditions" className="min-h-[4rem] resize-none" value={discountDraft.conditions || ""} onChange={(event) => updateDiscountDraft("conditions", event.target.value)} placeholder={t("sessions.discounts.form.conditionsPlaceholder")} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={discountDraft.active || false} onCheckedChange={(checked) => updateDiscountDraft("active", !!checked)} />
          <span className="text-sm text-foreground font-medium">{t("sessions.discounts.active")}</span>
        </label>
      </div>
    </FormModal>
  );
}
