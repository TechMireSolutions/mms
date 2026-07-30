import type React from "react";
import { useCallback, useState } from "react";
import type { FieldDefinition } from "@mms/shared";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FIELD_TYPE_KEYS,
  normalizeOptions,
  optionsToString,
  type CustomFieldConfig,
} from "./customFieldsBuilderUtils";
import { CustomFieldEditorTypeSections } from "./CustomFieldEditorTypeSections";

interface FieldEditorProps {
  field: CustomFieldConfig;
  existingLabels?: string[];
  onSave: (field: CustomFieldConfig) => void;
  onCancel: () => void;
}

export interface DraftFieldState extends Omit<CustomFieldConfig, "options"> {
  options: string[];
  _optionsString: string;
}

export function FieldEditor({
  field,
  existingLabels = [],
  onSave,
  onCancel,
}: FieldEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const fieldTypeOptions = FIELD_TYPE_KEYS.map((typeOption) => ({
    value: typeOption.value,
    label: t(typeOption.labelKey),
  }));
  const [draft, setDraft] = useState<DraftFieldState>(() => ({
    ...field,
    options: normalizeOptions(field.options),
    _optionsString: optionsToString(normalizeOptions(field.options)),
  }));

  const upd = useCallback(<K extends keyof DraftFieldState>(key: K, value: DraftFieldState[K]): void => {
    setDraft((draftField) => ({ ...draftField, [key]: value }));
  }, []);

  const trimmedLabel = draft.label.trim();
  const isDuplicateLabel = existingLabels
    .filter((label) => label !== field.label)
    .some((label) => label.toLowerCase() === trimmedLabel.toLowerCase());
  const isValid = trimmedLabel.length >= 2 && !isDuplicateLabel;

  const handleSave = (): void => {
    if (!isValid) return;
    const { _optionsString, ...fieldWithoutTransientOptions } = draft;
    onSave({ ...fieldWithoutTransientOptions, options: normalizeOptions(_optionsString) });
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={FORM_LABEL} htmlFor={`label-${draft.key}`}>{t("fields.fieldName")}</label>
          <Input
            id={`label-${draft.key}`}
            value={draft.label}
            onChange={(event) => upd("label", event.target.value)}
            placeholder={t("fields.namePlaceholder")}
            autoFocus
          />
          {isDuplicateLabel && (
            <p className="text-xs text-destructive mt-1">{t("fields.duplicateName")}</p>
          )}
          {trimmedLabel.length > 0 && trimmedLabel.length < 2 && (
            <p className="text-xs text-warning mt-1">{t("fields.nameTooShort")}</p>
          )}
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor={`type-${draft.key}`}>{t("fields.fieldType")}</label>
          <FormSelect
            id={`type-${draft.key}`}
            value={draft.type}
            onChange={(value) => upd("type", value as FieldDefinition["type"])}
            options={fieldTypeOptions}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={FORM_LABEL} htmlFor={`desc-${draft.key}`}>
            {t("fields.descriptionLabel")} <span className="normal-case font-normal text-muted-foreground/70">{t("fields.adminNote")}</span>
          </label>
          <Input
            id={`desc-${draft.key}`}
            value={draft.description || ""}
            onChange={(event) => upd("description", event.target.value)}
            placeholder={t("fields.descriptionPlaceholder")}
          />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor={`placeholder-${draft.key}`}>{t("fields.placeholderLabel")}</label>
          <Input
            id={`placeholder-${draft.key}`}
            value={draft.placeholder || ""}
            onChange={(event) => upd("placeholder", event.target.value)}
            placeholder={t("fields.hintPlaceholder")}
          />
        </div>
      </div>

      {draft.type !== "boolean" && draft.type !== "tags" && (
        <div>
          <label className={FORM_LABEL} htmlFor={`defVal-${draft.key}`}>
            {t("fields.defaultValueLabel")} <span className="normal-case font-normal text-muted-foreground/70">{t("fields.defaultValueHint")}</span>
          </label>
          <Input
            id={`defVal-${draft.key}`}
            value={(draft.defaultValue as string | number | undefined) || ""}
            onChange={(event) => upd("defaultValue", event.target.value)}
            placeholder={t("fields.defaultBlankPlaceholder")}
          />
        </div>
      )}

      <CustomFieldEditorTypeSections draft={draft} upd={upd} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <Checkbox
            checked={draft.required}
            onCheckedChange={() => upd("required", !draft.required)}
            aria-label={t("fields.toggleRequiredAria")}
          />
          <span>{t("common.required")}</span>
        </div>
        <div className="flex items-center gap-2 select-none text-sm font-medium text-foreground">
          <Checkbox
            checked={draft.unique}
            onCheckedChange={() => upd("unique", !draft.unique)}
            aria-label={t("fields.toggleUniqueAria")}
          />
          <span>{t("common.unique")}</span>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-3 py-2 min-h-11 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
          aria-label={t("fields.cancelEditingAria")}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="flex items-center gap-1.5 px-4 py-2 min-h-11 bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-colors hover:bg-primary/90 shadow-none"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t("fields.saveField")}</span>
        </Button>
      </div>
    </div>
  );
}
