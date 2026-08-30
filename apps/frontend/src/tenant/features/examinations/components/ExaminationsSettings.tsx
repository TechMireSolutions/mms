import React, { useEffect } from "react";
import { FileText } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { ExaminationsPreferencesSection } from "@/tenant/features/examinations/components/ExaminationsPreferencesSection";
import { useExaminationsSetupPanelState } from "@/tenant/features/examinations/hooks/useExaminationsSetupPanelState";

export interface ExaminationsSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const ExaminationsSettings = React.memo(function ExaminationsSettings({
  onPrefsDirtyChange,
}: ExaminationsSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useExaminationsSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("examinations.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        accentColor="primary"
        icon={FileText}
        title={t("examinations.settings.titlePreferences")}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <ExaminationsPreferencesSection
          settingsDraft={settingsDraft}
          upd={upd}
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

export default ExaminationsSettings;
