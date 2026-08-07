import React from "react";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import type { StudentsSettings } from "@mms/shared";

type StudentsPreferencesSectionProps = {
  settingsDraft: StudentsSettings;
  upd: <K extends keyof StudentsSettings>(field: K, value: StudentsSettings[K]) => void;
};

/** Students Setup Preferences body — Contacts PreferencesSection analogue. */
export function StudentsPreferencesSection({
  settingsDraft,
  upd,
}: StudentsPreferencesSectionProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          {t("students.settings.grSectionTitle")}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
          <Field
            label={t("students.settings.grTemplate")}
            hint={t("students.settings.grTemplateHint", { seq: "{seq}", year: "{year}" })}
          >
            <Input
              id="gr-template"
              className={FORM_INPUT}
              value={settingsDraft.grNumberTemplate || ""}
              onChange={(event) => upd("grNumberTemplate", event.target.value)}
              placeholder={t("students.settings.grTemplatePlaceholder", { seq: "{seq}", year: "{year}" })}
            />
          </Field>
          <Field
            label={t("students.settings.grDigits")}
            hint={t("students.settings.grDigitsHint")}
          >
            <Input
              id="gr-digits"
              type="number"
              min="1"
              max="8"
              className={FORM_INPUT}
              value={settingsDraft.grNumberDigits || 4}
              onChange={(event) => upd("grNumberDigits", Number(event.target.value))}
            />
          </Field>
        </div>
        <ToggleRow
          label={t("students.settings.restartAnnually")}
          description={t("students.settings.restartAnnuallyDesc")}
          value={settingsDraft.grNumberRestartAnnually ?? true}
          onChange={(value) => upd("grNumberRestartAnnually", value)}
        />
      </div>

      <div className="space-y-2 pt-1 border-t border-border/40" role="group" aria-label={t("students.settings.title")}>
        <ToggleRow
          label={t("students.settings.autoGenerateId")}
          description={t("students.settings.autoGenerateIdDesc")}
          value={settingsDraft.autoGenerateId}
          onChange={(value) => upd("autoGenerateId", value)}
        />
      </div>
    </div>
  );
}
