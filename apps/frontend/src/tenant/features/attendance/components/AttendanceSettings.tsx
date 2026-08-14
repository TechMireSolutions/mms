import { type AttendanceSettings } from "@mms/shared";
import React, { useMemo, useState } from "react";
import { Save } from "lucide-react";
import {
  ATTENDANCE_TAB_REGISTRY,
  ATTENDANCE_MODULE_MANIFEST,
  INITIAL_ATTENDANCE_FIELD_SEED,
  isAttendanceSystemFormField,
  isAttendanceSeedFormTab,
  isAttendanceLockedEnabledTab,
  type AppTranslationKey,
} from "@mms/shared";
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { notify } from "@/lib/notify";
import { AttendanceSettingsPreferencesSection } from "@/tenant/features/attendance/components/AttendanceSettingsPreferencesSection";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "attendance.setup.fields",
  preferences: "attendance.setup.preferences",
};

export function AttendanceSettings() {
  const { canEditSetup } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const { t } = useTranslation();
  const config = useAttendanceConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor<AttendanceSettings>({
    config,
    tabRegistry: ATTENDANCE_TAB_REGISTRY,
  });

  const settingsSubTabs = useMemo(
    () => ATTENDANCE_MODULE_MANIFEST.setupSubTabs.map((key) => ({
      key,
      label: t(SETUP_TAB_LABEL_KEYS[key]),
    })),
    [t],
  );
  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key ?? "fields");

  const wrappedFieldsEditor = useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: fieldsEditor.handleDeleteField,
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => ATTENDANCE_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_ATTENDANCE_FIELD_SEED,
        isLockedTab: isAttendanceLockedEnabledTab,
      }),
    [fieldsEditor],
  );

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

  const showPrefs = sub === "preferences";
  const showFields = sub === "fields";

  return (
    <section className="max-w-2xl space-y-6">
      <SubTabBar tabs={settingsSubTabs} value={sub} onChange={setSub} />
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("attendance.settings.readOnly")} />
      ) : (
      <>
      {showPrefs && (
        <AttendanceSettingsPreferencesSection t={t} settingsDraft={settingsDraft} upd={upd} />
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={isAttendanceSystemFormField}
          isProtectedTab={isAttendanceSeedFormTab}
          isLockedTab={isAttendanceLockedEnabledTab}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          onClick={() => void handleSave()}
          className={cn("ms-auto", saved && "bg-success hover:bg-success/90 text-success-foreground")}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? t("settings.savedBadge") : t("common.save")}
        </Button>
      </footer>
      </>
      )}
    </section>
  );
}
