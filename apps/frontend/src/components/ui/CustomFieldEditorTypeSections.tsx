import type React from "react";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { DraftFieldState } from "./CustomFieldEditor";

interface CustomFieldEditorTypeSectionsProps {
  draft: DraftFieldState;
  upd: <K extends keyof DraftFieldState>(key: K, value: DraftFieldState[K]) => void;
}

export function CustomFieldEditorTypeSections({ draft, upd }: CustomFieldEditorTypeSectionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const hasTextLength = draft.type === "text" || draft.type === "textarea";
  const hasOptions = draft.type === "select" || draft.type === "tags";
  const hasNumRange = draft.type === "number";

  return (
    <>
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
    </>
  );
}
