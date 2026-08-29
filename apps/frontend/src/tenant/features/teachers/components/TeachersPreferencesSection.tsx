import React from "react";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersSettings } from "@mms/shared";

export interface TeachersPreferencesSectionProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
}

/** Teachers Setup Preferences body — Students PreferencesSection analogue. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("teachers.settings.idPrefix")}>
          <Input
            id="teacher-idPrefix"
            name="teacher-idPrefix"
            className={FORM_INPUT}
            value={settingsDraft.idPrefix || ""}
            onChange={(event) => upd("idPrefix", event.target.value)}
            placeholder="TCH-"
          />
        </Field>

        <Field label={t("teachers.settings.defaultSpecialization")}>
          <FormSelect
            id="teacher-defaultSpecialization"
            value={settingsDraft.defaultSpecialization}
            onChange={(specialization) => upd("defaultSpecialization", specialization)}
            options={specializationOptions}
          />
        </Field>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/60">
        <ToggleRow
          label={t("teachers.settings.autoGenerateId")}
          value={settingsDraft.autoGenerateId}
          onChange={(value) => upd("autoGenerateId", value)}
        />

        <ToggleRow
          label={t("teachers.settings.requireContactLink")}
          value={settingsDraft.requireContactLink}
          onChange={(value) => upd("requireContactLink", value)}
        />
      </div>
    </div>
  );
}

