import React, { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFacultySetupPanelState } from "@/tenant/features/faculty/hooks/useFacultySetupPanelState";
import { FacultyPreferencesSection } from "@/tenant/features/faculty/components/FacultyPreferencesSection";
import { FacultyDesignationsSetupSection } from "@/tenant/features/faculty/components/FacultyDesignationsSetupSection";
import { FacultyDepartmentsSetupSection } from "@/tenant/features/faculty/components/FacultyDepartmentsSetupSection";

export interface FacultySettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const FacultySettings = (function FacultySettings({
  onPrefsDirtyChange,
}: FacultySettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
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
    ? t("faculty.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <FacultyPreferencesSection
        settingsDraft={settingsDraft}
        upd={upd}
        isPrefsDirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        onSave={handleSave}
      />

      <FacultyDepartmentsSetupSection />

      <FacultyDesignationsSetupSection />
    </div>
  );
});

export default FacultySettings;

