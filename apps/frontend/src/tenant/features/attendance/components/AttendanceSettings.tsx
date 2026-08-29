import React, { useEffect } from "react";
import { ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { AttendanceSettingsPreferencesSection } from "@/tenant/features/attendance/components/AttendanceSettingsPreferencesSection";
import { useAttendanceSetupPanelState } from "@/tenant/features/attendance/hooks/useAttendanceSetupPanelState";

export interface AttendanceSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const AttendanceSettings = React.memo(function AttendanceSettings({
  onPrefsDirtyChange,
}: AttendanceSettingsProps = {}): React.JSX.Element {
  const { canEditSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { t } = useTranslation();
  const {
    settingsDraft,
    saved,
    saving,
    isPrefsDirty,
    upd,
    handleSave,
  } = useAttendanceSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("attendance.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="max-w-3xl space-y-6 text-start">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("attendance.settings.readOnly")} />
      ) : (
        <>
          <AttendanceSettingsPreferencesSection
            t={t}
            settingsDraft={settingsDraft}
            upd={upd}
          />

          <ModuleSetupSaveFooter
            dirty={isPrefsDirty}
            saving={saving}
            saved={saved}
            unsavedWarning={unsavedWarning}
            saveLabel={t("common.save")}
            savedLabel={t("settings.savedBadge")}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
});

export default AttendanceSettings;
