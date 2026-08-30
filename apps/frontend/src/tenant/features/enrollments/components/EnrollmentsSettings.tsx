import React, { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { EnrollmentsPreferencesSection } from "@/tenant/features/enrollments/components/EnrollmentsPreferencesSection";
import { useEnrollmentsSetupPanelState } from "@/tenant/features/enrollments/hooks/useEnrollmentsSetupPanelState";

export interface EnrollmentsSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const EnrollmentsSettings = React.memo(function EnrollmentsSettings({
  onPrefsDirtyChange,
}: EnrollmentsSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useEnrollmentsSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("enrollments.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        title={t("enrollments.settings.title")}
        icon={ClipboardList}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <EnrollmentsPreferencesSection
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

export default EnrollmentsSettings;
