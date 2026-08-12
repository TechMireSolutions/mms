import React, { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { School } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  INITIAL_TEACHERS_FIELD_SEED,
  TEACHERS_MODULE_MANIFEST,
  TEACHER_LOCKED_ENABLED_TABS,
  isTeacherLockedEnabledTab,
  isTeacherSeedFormTab,
  isTeacherSystemFormField,
  getTeacherSeedFormTab,
  type AppTranslationKey,
} from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useTeacherLookupOptions } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { useTeachersSetupSaveActions } from "@/tenant/features/teachers/hooks/useTeachersSetupSaveActions";
import { TeachersPreferencesSection } from "@/tenant/features/teachers/components/TeachersPreferencesSection";

const TeachersSettingsLookupsPanel = lazy(() =>
  import("@/tenant/features/teachers/components/TeachersSettingsLookupsPanel").then((mod) => ({
    default: mod.TeachersSettingsLookupsPanel,
  })),
);

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "teachers.setup.fields",
  preferences: "teachers.setup.preferences",
  lookups: "teachers.setup.lookups",
};

export function TeachersSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(TEACHERS_MODULE_MANIFEST);
  const config = useTeacherConfig();
  const { specializationOptions } = useTeacherLookupOptions();
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
    tabRegistry: TEACHERS_TAB_REGISTRY,
    lockedEnabledTabs: TEACHER_LOCKED_ENABLED_TABS,
  });

  const settingsSubTabs = useMemo(
    () =>
      TEACHERS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const dirtyRef = useRef({ fields: false, prefs: false });

  const subTabs = useModuleSetupSubTabs({
    initialKey: settingsSubTabs[0]?.key || "fields",
    isDirty: (currentKey) => {
      if (currentKey === "fields") return dirtyRef.current.fields;
      if (currentKey === "preferences") return dirtyRef.current.prefs;
      return false;
    },
    onDiscard: () => {
      discardDrafts();
      dirtyRef.current = { fields: false, prefs: false };
      setSaved(true);
    },
  });

  const showFields = subTabs.showFields;
  const showPrefs = subTabs.showPrefs;
  const showLookups = subTabs.showLookups;

  const {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    handleDeleteFieldWithGuard,
    handleDeleteTabWithGuard,
  } = useTeachersSetupSaveActions({
    settings,
    settingsDraft,
    fieldsEditor,
    mode: showPrefs ? "preferences" : "fields",
    setSaved,
  });

  useEffect(() => {
    dirtyRef.current.fields = isFieldsDirty;
    dirtyRef.current.prefs = isPrefsDirty;
  }, [isFieldsDirty, isPrefsDirty]);

  const wrappedFieldsEditor = useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: handleDeleteFieldWithGuard,
        handleDeleteTab: handleDeleteTabWithGuard,
        getSeedTab: getTeacherSeedFormTab,
        initialFieldSeed: INITIAL_TEACHERS_FIELD_SEED,
        isLockedTab: isTeacherLockedEnabledTab,
      }),
    [fieldsEditor, handleDeleteFieldWithGuard, handleDeleteTabWithGuard],
  );

  const unsavedWarning = showFields
    ? t("teachers.setup.unsavedFieldsWarning")
    : showPrefs
      ? t("teachers.setup.unsavedPreferencesWarning")
      : undefined;

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={subTabs.sub}
        onChange={subTabs.handleSubTabChange}
      />

      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("teachers.setupReadOnly")} />
      ) : (
        <SectionCard title={t("teachers.settings.title")} icon={School} accentColor="primary">
          <div className="space-y-4">
            {showPrefs ? (
              <TeachersPreferencesSection
                settingsDraft={settingsDraft}
                upd={upd}
                specializationOptions={specializationOptions}
              />
            ) : null}

            {showFields && (
              <ModuleFieldsSetup
                editor={wrappedFieldsEditor}
                isCoreField={isTeacherSystemFormField}
                isProtectedTab={isTeacherSeedFormTab}
                isLockedTab={isTeacherLockedEnabledTab}
                onStateChange={() => setSaved(false)}
              />
            )}

            {showLookups ? (
              <Suspense fallback={<ModulePanelSuspenseFallback />}>
                <TeachersSettingsLookupsPanel />
              </Suspense>
            ) : null}

            {!showLookups ? (
              <ModuleSetupSaveFooter
                dirty={isDirty}
                saving={saving}
                saved={saved}
                unsavedWarning={unsavedWarning}
                saveLabel={t("common.save")}
                savedLabel={t("settings.savedBadge")}
                onSave={handleSave}
              />
            ) : null}
          </div>
        </SectionCard>
      )}

      <ConfirmAlertDialog
        open={subTabs.discardConfirmOpen}
        onOpenChange={(open) => {
          if (!open) subTabs.clearPendingSubTab();
        }}
        title={t("settings.unsavedChanges")}
        description={
          subTabs.discardConfirmIsFields
            ? t("teachers.setup.discardUnsavedFieldsConfirm")
            : t("teachers.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={subTabs.handleConfirmDiscard}
      />
    </div>
  );
}
