import React, { useState } from "react";
import { Gift } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { TabarrukItem } from '@/lib/data/sessionsData';

const EMPTY: Partial<TabarrukItem> = { item: "", quantity: "", occasion: "", date: "", note: "" };

export interface TabarrukModalProps {
  open: boolean;
  entry: TabarrukItem | null;
  onClose: () => void;
  onSave: (entry: TabarrukItem) => void | Promise<void>;
  saving: boolean;
}

export function TabarrukModal({ open, entry, onClose, onSave, saving }: TabarrukModalProps) {
  const { t } = useTranslation();
  const [tabarrukDraft, setTabarrukDraft] = useState<Partial<TabarrukItem>>(entry ? { ...entry } : { ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateTabarrukDraft = (field: keyof TabarrukItem, value: string) => setTabarrukDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setTabarrukDraft(entry ? { ...entry } : { ...EMPTY });
      setErrors({});
    }
  }, [open, entry]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!tabarrukDraft.item?.trim()) {
      newErrors.item = t("common.formPleaseFixErrors");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({ ...tabarrukDraft, id: entry?.id || `tb${crypto.randomUUID()}` } as TabarrukItem);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={entry ? t("sessions.tabarruk.edit") : t("sessions.tabarruk.add")}
      icon={Gift}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      error={Object.values(errors)[0]}
      saveDisabled={!tabarrukDraft.item?.trim()}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-item">{t("sessions.tabarruk.form.item")}<RequiredMark /></label>
          <Input
            id="tabarruk-item"
            name="item"
            value={tabarrukDraft.item || ""}
            onChange={(event) => updateTabarrukDraft("item", event.target.value)}
            placeholder={t("sessions.tabarruk.form.itemPlaceholder")}
            aria-invalid={Boolean(errors.item)}
            aria-describedby={errors.item ? "tabarruk-item-error" : undefined}
            className={errors.item ? FORM_INPUT_ERROR : undefined}
            required
          />
          <FieldErrorMessage id="tabarruk-item-error" message={errors.item} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-quantity">{t("sessions.tabarruk.form.quantity")}</label>
            <Input id="tabarruk-quantity" name="quantity" value={tabarrukDraft.quantity || ""} onChange={(event) => updateTabarrukDraft("quantity", event.target.value)} placeholder={t("sessions.tabarruk.form.quantityPlaceholder")} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-date">{t("sessions.tabarruk.form.date")}</label>
            <DatePicker
              id="tabarruk-date"
              name="date"
              value={tabarrukDraft.date || ""}
              onChange={(value) => updateTabarrukDraft("date", value)}
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-occasion">{t("sessions.tabarruk.form.occasion")}</label>
          <Input id="tabarruk-occasion" name="occasion" value={tabarrukDraft.occasion || ""} onChange={(event) => updateTabarrukDraft("occasion", event.target.value)} placeholder={t("sessions.tabarruk.form.occasionPlaceholder")} />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-note">{t("sessions.tabarruk.form.note")}</label>
          <Textarea id="tabarruk-note" name="note" className="min-h-textarea-sm resize-none" value={tabarrukDraft.note || ""} onChange={(event) => updateTabarrukDraft("note", event.target.value)} placeholder={t("sessions.tabarruk.form.notePlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}
