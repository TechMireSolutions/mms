import React, { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import type { Mujtahid, MujtahidRep } from "@/tenant/features/obligations/components/mujtahidManagerTypes";

export interface NameFormModalProps {
  title: string;
  initial: Partial<Mujtahid> | Partial<MujtahidRep>;
  onSave: (form: Partial<Mujtahid> | Partial<MujtahidRep>) => void;
  onClose: () => void;
  label: string;
}

export function NameFormModal({ initial, onSave, onClose, label, title }: NameFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [error, setError] = useState("");

  const handleSave = (): void => {
    if (!form.name || !form.name.trim()) {
      setError(t("obligations.mujtahids.nameRequired"));
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
      error={error || undefined}
    >
      <div>
        <label htmlFor="name-form-input" className={FORM_LABEL}>{label} *</label>
        <Input
          id="name-form-input"
          value={form.name || ""}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className={FORM_INPUT}
          aria-invalid={!!error}
        />
      </div>
    </FormModal>
  );
}
