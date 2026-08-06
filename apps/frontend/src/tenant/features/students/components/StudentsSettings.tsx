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
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { Loader2, Save, GraduationCap, Lock } from "lucide-react";
import { useStudentsSetupFieldDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupFieldDeleteGuard";
import { useStudentsSetupTabDeleteGuard } from "@/tenant/features/students/hooks/useStudentsSetupTabDeleteGuard";
import { useStudentsSettingsSave } from "@/tenant/features/students/hooks/useStudentsSettingsSave";
import { StudentsSettingsPreferencesPanel } from "@/tenant/features/students/components/StudentsSettingsPreferencesPanel";
import { StudentsSettingsLookupsPanel } from "@/tenant/features/students/components/StudentsSettingsLookupsPanel";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "students.setup.fields",
  preferences: "students.setup.preferences",
  lookups: "students.setup.lookups",
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
    discardDrafts,
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
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";
  const showLookups = sub === "lookups";

  const { saving, isDirty, isFieldsDirty, isPrefsDirty, handleSave } = useStudentsSettingsSave({
    settings,
    settingsDraft,
    fieldsEditor,
    showPrefs,
    setSaved,
  });

  const discardConfirmOpen = pendingSubTab != null;
  const discardConfirmIsFields = sub === "fields" && isFieldsDirty;

  const handleSubTabChange = (next: string): void => {
    if (next === sub) return;
    if ((sub === "fields" && isFieldsDirty) || (sub === "preferences" && isPrefsDirty)) {
      setPendingSubTab(next);
      return;
    }
    setSub(next);
  };

  const handleConfirmDiscard = (): void => {
    if (!pendingSubTab) return;
    discardDrafts();
    setSub(pendingSubTab);
    setPendingSubTab(null);
  };

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={handleSubTabChange}
      />

      {!canEditSetup ? (
        <div className={`${WORK_SURFACE} border-border/40 p-6`}>
          <EmptyState variant="dashed" icon={Lock} title={t("students.setupReadOnly")} />
        </div>
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

          {!showLookups && isDirty ? (
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

          {showLookups ? <StudentsSettingsLookupsPanel /> : null}

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

          {!showLookups ? (
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
          ) : null}
        </section>
      )}

      <ConfirmAlertDialog
        open={discardConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setPendingSubTab(null);
        }}
        title={t("settings.unsavedChanges")}
        description={
          discardConfirmIsFields
            ? t("students.setup.discardUnsavedFieldsConfirm")
            : t("students.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
