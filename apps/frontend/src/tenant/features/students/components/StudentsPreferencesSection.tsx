import React from "react";
import { SlidersHorizontal, Hash } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import type { StudentsSettings } from "@mms/shared";

export interface StudentsPreferencesSectionProps {
  settingsDraft: StudentsSettings;
  upd: <K extends keyof StudentsSettings>(field: K, value: StudentsSettings[K]) => void;
}

/** Students Setup Preferences body — Contacts PreferencesSection analogue. */
export function StudentsPreferencesSection({
  settingsDraft,
  upd,
}: StudentsPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("students.settings.grSectionTitle")}
        icon={Hash}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-3">
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
      </SectionCard>

      <SectionCard
        title={t("students.settings.title")}
        icon={SlidersHorizontal}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-2 pt-1">
          <ToggleRow
            label={t("students.settings.autoGenerateId")}
            description={t("students.settings.autoGenerateIdDesc")}
            value={settingsDraft.autoGenerateId}
            onChange={(value) => upd("autoGenerateId", value)}
          />
        </div>
      </SectionCard>
    </div>
  );
}
