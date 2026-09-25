import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersSettings } from "@mms/shared";
import { FacultyIdSettingsCard } from "./FacultyIdSettingsCard";

export interface TeachersPreferencesSectionProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
}

export type FacultyPreferencesSectionProps = TeachersPreferencesSectionProps;

/** Teachers Setup Preferences body — modernized and streamlined. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      {/* Employee ID Format & Generation Card */}
      <FacultyIdSettingsCard settingsDraft={settingsDraft} upd={upd} />

      {/* General Faculty Module Configuration Card */}
      <SectionCard
        title={t("teachers.settings.title")}
        icon={SlidersHorizontal}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <Field
            label={t("teachers.settings.defaultSpecialization")}
            id="teacher-defaultSpecialization"
          >
            <FormSelect
              id="teacher-defaultSpecialization"
              name="defaultSpecialization"
              value={settingsDraft.defaultSpecialization}
              onChange={(specialization) => upd("defaultSpecialization", specialization)}
              options={specializationOptions}
            />
          </Field>

          <div className="pt-2 border-t border-border/60">
            <ToggleRow
              label={t("teachers.settings.requireContactLink")}
              value={settingsDraft.requireContactLink}
              onChange={(value) => upd("requireContactLink", value)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export const FacultyPreferencesSection = TeachersPreferencesSection;
