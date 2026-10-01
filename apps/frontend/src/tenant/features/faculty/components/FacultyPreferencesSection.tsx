import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultySettings } from "@mms/shared";
import { FacultyIdSettingsCard } from "./FacultyIdSettingsCard";

export interface FacultyPreferencesSectionProps {
  settingsDraft: FacultySettings;
  upd: <K extends keyof FacultySettings>(field: K, value: FacultySettings[K]) => void;
  specializationOptions: string[];
  isPrefsDirty?: boolean;
  saving?: boolean;
  saved?: boolean;
  onSave?: () => void | Promise<void>;
}

/** Faculty Setup Preferences body. */
export function FacultyPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
  isPrefsDirty,
  saving,
  saved,
  onSave,
}: FacultyPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      {/* Employee ID Format & Generation Card */}
      <FacultyIdSettingsCard
        settingsDraft={settingsDraft}
        upd={upd}
        isPrefsDirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        onSave={onSave}
      />

      {/* General Faculty Module Configuration Card */}
      <SectionCard
        title={t("faculty.settings.title")}
        icon={SlidersHorizontal}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <Field
            label={t("faculty.settings.defaultSpecialization")}
            id="faculty-defaultSpecialization"
          >
            <FormSelect
              id="faculty-defaultSpecialization"
              name="defaultSpecialization"
              value={settingsDraft.defaultSpecialization}
              onChange={(specialization) => upd("defaultSpecialization", specialization)}
              options={specializationOptions}
            />
          </Field>

          <div className="pt-2 border-t border-border/60">
            <ToggleRow
              label={t("faculty.settings.requireContactLink")}
              value={settingsDraft.requireContactLink}
              onChange={(value) => upd("requireContactLink", value)}
            />
          </div>

          <ModuleSetupSaveFooter
            dirty={Boolean(isPrefsDirty)}
            saving={Boolean(saving)}
            saved={Boolean(saved)}
            saveLabel={saving ? t("global.saving") : t("common.save")}
            savedLabel={t("settings.savedBadge")}
            onSave={onSave ?? (() => {})}
            disableUnsavedGuard
            footerClassName="mt-4 pt-3"
          />
        </div>
      </SectionCard>
    </div>
  );
}
