import React, { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { Field, RequiredMark } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NameFormModal } from "@/tenant/features/obligations/components/MujtahidNameFormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import type { Mujtahid, MujtahidRep } from "@/tenant/features/obligations/components/mujtahidManagerTypes";

export interface RepresentativeFormModalProps {
  title: string;
  initial: Partial<MujtahidRep>;
  mujtahids: Mujtahid[];
  onSave: (form: Partial<MujtahidRep>) => Promise<unknown> | void;
  onClose: () => void;
  onChangeMujtahids?: (mujtahids: Mujtahid[]) => Promise<void> | void;
}

export function RepresentativeFormModal({
  title,
  initial,
  mujtahids,
  onSave,
  onClose,
  onChangeMujtahids,
}: RepresentativeFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isAddMujtahidOpen, setIsAddMujtahidOpen] = useState(false);

  const generateEntityId = (prefix: string): string => {
    const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11);
    return `${prefix}${uuid}`;
  };

  const handleSaveMujtahid = async (newMujtahid: Partial<Mujtahid>) => {
    if (onChangeMujtahids) {
      const id = generateEntityId("m");
      await onChangeMujtahids([...mujtahids, { ...newMujtahid, id } as Mujtahid]);
      setForm({ ...form, mujtahid_id: id });
    }
    setIsAddMujtahidOpen(false);
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (!form.name || !form.name.trim()) nextErrors.name = t("obligations.mujtahids.nameRequired");
    if (!form.mujtahid_id) nextErrors.mujtahid = "Mujtahid is required";
    return nextErrors;
  };

  const handleSave = async (): Promise<void> => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, name: form.name?.trim() });
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : t("obligations.saveFailed") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FormModal
        open={!isAddMujtahidOpen}
        onClose={onClose}
        title={title}
        cancelLabel={t("common.cancel")}
        saveLabel={t("common.save")}
        onSave={handleSave}
        saving={saving}
        saveDisabled={saving}
        error={errors.submit ? [errors.submit] : undefined}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="mujtahid-select" className={FORM_LABEL}>
              {t("obligations.form.mujtahidLabel")}
              <RequiredMark />
            </label>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormSelect
                  id="mujtahid-select"
                  value={form.mujtahid_id || ""}
                  onChange={(val) => {
                    setErrors((prev) => ({ ...prev, mujtahid: "" }));
                    setForm({ ...form, mujtahid_id: val });
                  }}
                  options={mujtahids.map((m) => ({ value: m.id, label: m.name }))}
                  placeholder="Select..."
                />
              </div>
              {onChangeMujtahids && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mb-[0px] h-10 w-10 shrink-0"
                  onClick={() => setIsAddMujtahidOpen(true)}
                  aria-label={t("obligations.mujtahids.add")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {errors.mujtahid && <p className="mt-1 text-sm font-medium text-destructive">{errors.mujtahid}</p>}
          </div>

          <Field id="rep-name-input" label={t("obligations.mujtahids.repNameLabel")} required error={errors.name}>
            <Input
              id="rep-name-input"
              value={form.name || ""}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, name: "" }));
                setForm({ ...form, name: e.target.value });
              }}
              disabled={saving}
              aria-invalid={!!errors.name}
            />
          </Field>
        </div>
      </FormModal>

      {isAddMujtahidOpen && (
        <NameFormModal
          title={t("obligations.mujtahids.addTitle")}
          label={t("obligations.mujtahids.nameLabel")}
          initial={{ name: "" }}
          onSave={handleSaveMujtahid}
          onClose={() => setIsAddMujtahidOpen(false)}
        />
      )}
    </>
  );
}
