import React, { useEffect } from "react";
import { School } from "lucide-react";
import { useFacultyLookupOptions } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SectionCard } from "@/components/ui/SectionCard";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useFacultySetupPanelState } from "@/tenant/features/faculty/hooks/useFacultySetupPanelState";
import { FacultyPreferencesSection } from "@/tenant/features/faculty/components/FacultyPreferencesSection";
import { FacultyDesignationsSetupSection } from "@/tenant/features/faculty/components/FacultyDesignationsSetupSection";

export interface FacultySettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}
export type TeachersSettingsProps = FacultySettingsProps;

export const FacultySettings = (function FacultySettings({
  onPrefsDirtyChange,
}: FacultySettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { specializationOptions } = useFacultyLookupOptions();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useFacultySetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? (t("faculty.setup.unsavedPreferencesWarning") || t("teachers.setup.unsavedPreferencesWarning"))
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        title={t("faculty.settings.title") || t("teachers.settings.title")}
        icon={School}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <FacultyPreferencesSection
          settingsDraft={settingsDraft}
          upd={upd}
          specializationOptions={specializationOptions}
        />
      </SectionCard>

      <FacultyDesignationsSetupSection />

      <ModuleSetupSaveFooter
        dirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={handleSave}
      />
    </div>
  );
});

export const TeachersSettings = FacultySettings;
export default FacultySettings;

