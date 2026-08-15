import { type AttendanceSettings } from "@mms/shared";
import {
  ATTENDANCE_TAB_REGISTRY,
  ATTENDANCE_MODULE_MANIFEST,
} from "@mms/shared";
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { AttendanceSettingsPreferencesSection } from "@/tenant/features/attendance/components/AttendanceSettingsPreferencesSection";

export function AttendanceSettings() {
  const { canEditSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { t } = useTranslation();
  const config = useAttendanceConfig();
  const {
    settingsDraft,
    saved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor<AttendanceSettings>({
    config,
    tabRegistry: ATTENDANCE_TAB_REGISTRY,
  });

  const isDirty = !saved;

  const handleSave = async () => {
    try {
      await saveSettingsAsync();
      notify.success(t("attendance.settings.saved"));
    } catch (error) {
      notify.error(t("settings.serverSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <section className="max-w-2xl space-y-6">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("attendance.settings.readOnly")} />
      ) : (
        <>
          <AttendanceSettingsPreferencesSection t={t} settingsDraft={settingsDraft} upd={upd} />

          <ModuleSetupSaveFooter
            dirty={isDirty}
            saving={false}
            saved={saved}
            saveLabel={t("common.save")}
            savedLabel={t("settings.savedBadge")}
            onSave={() => void handleSave()}
          />
        </>
      )}
    </section>
  );
}

