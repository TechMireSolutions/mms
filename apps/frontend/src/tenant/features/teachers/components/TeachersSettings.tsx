import React, { useEffect } from "react";
import { School } from "lucide-react";
import { useTeacherLookupOptions } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SectionCard } from "@/components/ui/SectionCard";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTeachersSetupPanelState } from "@/tenant/features/teachers/hooks/useTeachersSetupPanelState";
import { TeachersPreferencesSection } from "@/tenant/features/teachers/components/TeachersPreferencesSection";

export interface TeachersSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const TeachersSettings = React.memo(function TeachersSettings({
  onPrefsDirtyChange,
}: TeachersSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { specializationOptions } = useTeacherLookupOptions();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useTeachersSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("teachers.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        title={t("teachers.settings.title")}
        icon={School}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <TeachersPreferencesSection
          settingsDraft={settingsDraft}
          upd={upd}
          specializationOptions={specializationOptions}
        />
      </SectionCard>

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

export default TeachersSettings;
