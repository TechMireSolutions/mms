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

  const hasTextLength = draft.type === "text" || draft.type === "textarea";
  const hasOptions = draft.type === "select" || draft.type === "tags";
  const hasNumRange = draft.type === "number";

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

      {hasOptions && (
        <div>
          <label className={FORM_LABEL} htmlFor={`opts-${draft.key}`}>
            {draft.type === "tags" ? t("fields.predefinedTags") : t("fields.options")}{" "}
            <span className="normal-case font-normal text-muted-foreground/70">{t("fields.commaSeparated")}</span>
          </label>
          <Input
            id={`opts-${draft.key}`}
            value={draft._optionsString}
            onChange={(event) => upd("_optionsString", event.target.value)}
            placeholder={draft.type === "tags" ? t("fields.tagsPlaceholder") : t("fields.optionsPlaceholder")}
          />
          {draft.type === "tags" && (
            <p className="text-xs text-muted-foreground mt-1">{t("fields.tagsHint")}</p>
          )}
        </div>
      )}

      {hasTextLength && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor={`minlen-${draft.key}`}>{t("fields.minLength")}</label>
            <Input
              id={`minlen-${draft.key}`}
              type="number"
              min={0}
              value={draft.minLength ?? ""}
              onChange={(event) => upd("minLength", event.target.value ? Number(event.target.value) : undefined)}
              placeholder={t("fields.minLengthPlaceholder")}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`maxlen-${draft.key}`}>{t("fields.maxLength")}</label>
            <Input
              id={`maxlen-${draft.key}`}
              type="number"
              min={1}
              value={draft.maxLength ?? ""}
              onChange={(event) => upd("maxLength", event.target.value ? Number(event.target.value) : undefined)}
              placeholder={t("fields.maxLengthPlaceholder")}
            />
          </div>
        </div>
      )}

      {hasNumRange && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={FORM_LABEL} htmlFor={`min-${draft.key}`}>{t("fields.minValue")}</label>
            <Input
              id={`min-${draft.key}`}
              type="number"
              value={draft.min ?? ""}
              onChange={(event) => upd("min", event.target.value ? Number(event.target.value) : undefined)}
              placeholder={t("fields.minValuePlaceholder")}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`max-${draft.key}`}>{t("fields.maxValue")}</label>
            <Input
              id={`max-${draft.key}`}
              type="number"
              value={draft.max ?? ""}
              onChange={(event) => upd("max", event.target.value ? Number(event.target.value) : undefined)}
              placeholder={t("fields.maxValuePlaceholder")}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor={`mask-${draft.key}`}>
              {t("fields.inputMask")} <span className="normal-case font-normal text-muted-foreground/70">{t("fields.optionalHint")}</span>
            </label>
            <Input
              id={`mask-${draft.key}`}
              value={draft.mask || ""}
              onChange={(event) => upd("mask", event.target.value)}
              placeholder={t("fields.maskPlaceholder")}
            />
          </div>
        </div>
      )}

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
