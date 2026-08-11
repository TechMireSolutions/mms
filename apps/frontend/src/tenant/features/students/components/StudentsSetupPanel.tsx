import React, { useEffect } from "react";
import {
  INITIAL_STUDENT_FIELD_SEED,
  isStudentLockedEnabledTab,
  isStudentSeedFormTab,
} from "@mms/shared";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentsPreferencesSection } from "@/tenant/features/students/components/StudentsPreferencesSection";
import { useStudentsSetupPanelState } from "@/tenant/features/students/hooks/useStudentsSetupPanelState";

interface StudentsSetupPanelProps {
  mode?: "fields" | "preferences";
  onFieldsDirtyChange?: (isDirty: boolean) => void;
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

/** Students Setup Fields/Preferences body — Contacts SetupPanel analogue. */
export default function StudentsSetupPanel({
  mode,
  onFieldsDirtyChange,
  onPrefsDirtyChange,
}: StudentsSetupPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    upd,
    saved,
    setSaved,
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    wrappedFieldsEditor,
    showFields,
    showPrefs,
  } = useStudentsSetupPanelState({ mode });

  useEffect(() => {
    if (!showFields) {
      onFieldsDirtyChange?.(false);
      return;
    }
    onFieldsDirtyChange?.(isFieldsDirty);
  }, [showFields, isFieldsDirty, onFieldsDirtyChange]);

  useEffect(() => {
    if (!showPrefs) {
      onPrefsDirtyChange?.(false);
      return;
    }
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [showPrefs, isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = showFields
    ? t("students.setup.unsavedFieldsWarning")
    : showPrefs
      ? t("students.setup.unsavedPreferencesWarning")
      : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      {showFields ? (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={(tabId, key) =>
            INITIAL_STUDENT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false
          }
          isProtectedTab={isStudentSeedFormTab}
          isLockedTab={isStudentLockedEnabledTab}
          onStateChange={() => setSaved(false)}
        />
      ) : null}

      {showPrefs ? (
        <StudentsPreferencesSection settingsDraft={settingsDraft} upd={upd} />
      ) : null}

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
