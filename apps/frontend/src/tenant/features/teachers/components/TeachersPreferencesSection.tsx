import React from "react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersSettings } from "@mms/shared";

type TeachersPreferencesSectionProps = {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
};

/** Teachers Setup Preferences body — Students PreferencesSection analogue. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <div>
        <label className={FORM_LABEL} htmlFor="teacher-idPrefix">{t("teachers.settings.idPrefix")}</label>
        <Input
          id="teacher-idPrefix"
          name="teacher-idPrefix"
          value={settingsDraft.idPrefix || ""}
          onChange={(event) => upd("idPrefix", event.target.value)}
        />
      </div>

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

      <div>
        <label className={FORM_LABEL} htmlFor="teacher-defaultSpecialization">
          {t("teachers.settings.defaultSpecialization")}
        </label>
        <FormSelect
          id="teacher-defaultSpecialization"
          value={settingsDraft.defaultSpecialization}
          onChange={(specialization) => upd("defaultSpecialization", specialization)}
          options={specializationOptions}
        />
      </div>
    </div>
  );
}
