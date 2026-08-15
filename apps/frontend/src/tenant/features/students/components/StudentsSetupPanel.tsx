import React from "react";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentsPreferencesSection } from "@/tenant/features/students/components/StudentsPreferencesSection";
import { useStudentsSetupPanelState } from "@/tenant/features/students/hooks/useStudentsSetupPanelState";

interface StudentsSetupPanelProps {
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

/** Students Setup Preferences body */
export default function StudentsSetupPanel({
  onPrefsDirtyChange,
}: StudentsSetupPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    upd,
    saved,
    saving,
    isDirty,
    isPrefsDirty,
    handleSave,
  } = useStudentsSetupPanelState({ mode: "preferences" });

  React.useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isDirty
    ? t("students.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <StudentsPreferencesSection settingsDraft={settingsDraft} upd={upd} />

      <ModuleSetupSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("students.settings.saveSettings")}
        savedLabel={t("students.settings.saveSuccess")}
        onSave={handleSave}
      />
    </div>
  );
}

