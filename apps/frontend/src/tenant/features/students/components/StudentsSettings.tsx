import React, { useMemo, useState } from "react";
import {
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  INITIAL_STUDENT_FIELD_SEED,
  STUDENTS_MODULE_MANIFEST,
  STUDENT_LOCKED_ENABLED_TABS,
  isStudentLockedEnabledTab,
  isStudentSeedFormTab,
  type AppTranslationKey,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { Loader2, Save, GraduationCap } from "lucide-react";
import { useStudentsSetupFieldDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupFieldDeleteGuard";
import { useStudentsSetupTabDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupTabDeleteGuard";
import { useStudentsSettingsSave } from "@/tenant/features/students/hooks/useStudentsSettingsSave";
import { StudentsSettingsPreferencesPanel } from "@/tenant/features/students/components/StudentsSettingsPreferencesPanel";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "students.setup.fields",
  preferences: "students.setup.preferences",
};

export default function StudentsSettings(): React.ReactElement {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: STUDENT_TAB_REGISTRY,
    defaultEnabledTabs: DEFAULT_STUDENT_ENABLED_TABS,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
    lockedEnabledTabs: [...STUDENT_LOCKED_ENABLED_TABS],
  });

  const fieldsDraft = useMemo(
    () => ({
      buildFieldsMap: fieldsEditor.buildFieldsMap,
      enabledTabs: fieldsEditor.enabledTabs,
      tabFields: fieldsEditor.tabFields,
    }),
    [fieldsEditor],
  );

  const handleDeleteFieldWithGuard = useStudentsSetupFieldDeleteGuard({
    settings,
    fieldsDraft,
    onDeleteField: fieldsEditor.handleDeleteField,
  });

  const handleDeleteTabWithGuard = useStudentsSetupTabDeleteGuard({
    settings,
    fieldsDraft,
    onDeleteTab: fieldsEditor.handleDeleteTab,
  });

  const guardedEditor = useMemo(
    () => ({
      ...fieldsEditor,
      handleDeleteField: handleDeleteFieldWithGuard,
      handleDeleteTab: handleDeleteTabWithGuard,
    }),
    [fieldsEditor, handleDeleteFieldWithGuard, handleDeleteTabWithGuard],
  );

  const settingsSubTabs = useMemo(
    () =>
      STUDENTS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key || "fields");
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";

  const { saving, isDirty, handleSave } = useStudentsSettingsSave({
    settings,
    settingsDraft,
    fieldsEditor,
    showPrefs,
    setSaved,
  });

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />

      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("students.setupReadOnly")}
        </p>
      ) : (
        <section className={`${WORK_SURFACE} p-5 space-y-5`} aria-labelledby="students-settings-title">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </div>
            <h3 id="students-settings-title" className="text-sm font-bold text-foreground">
              {t("students.settings.title")}
            </h3>
          </div>

          {isDirty ? (
            <WarningCallout
              role="alert"
              density="banner"
              description={
                showPrefs
                  ? t("students.setup.unsavedPreferencesWarning")
                  : t("students.setup.unsavedFieldsWarning")
              }
            />
          ) : null}

          {showPrefs ? (
            <StudentsSettingsPreferencesPanel settingsDraft={settingsDraft} upd={upd} />
          ) : null}

          {showFields ? (
            <ModuleFieldsSetup
              editor={guardedEditor}
              isCoreField={(tabId, key) =>
                INITIAL_STUDENT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false
              }
              isProtectedTab={isStudentSeedFormTab}
              isLockedTab={isStudentLockedEnabledTab}
              onStateChange={() => setSaved(false)}
            />
          ) : null}

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={() => { void handleSave(); }}
              disabled={saving || !isDirty}
              aria-busy={saving}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
              )}{" "}
              {saved ? t("students.settings.saveSuccess") : t("students.settings.saveSettings")}
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
