import React, { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { School } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  INITIAL_TEACHERS_FIELD_SEED,
  TEACHER_SPECIALIZATION_VALUES,
  TEACHERS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { useTeachersSetupSaveActions } from "@/tenant/features/teachers/hooks/useTeachersSetupSaveActions";

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
  const { specializations } = config;
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
    discardDrafts,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: TEACHERS_TAB_REGISTRY,
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
  } = useTeachersSetupSaveActions({
    settings,
    settingsDraft,
    fieldsEditor,
    mode: showPrefs ? "preferences" : "fields",
    setSaved,
    saveSettingsAsync,
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
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => TEACHERS_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_TEACHERS_FIELD_SEED,
        isLockedTab: (tabKey) => tabKey.toLowerCase() === "basic",
      }),
    [fieldsEditor, handleDeleteFieldWithGuard],
  );

  const specializationOptions = specializations.length > 0
    ? specializations
    : [...TEACHER_SPECIALIZATION_VALUES];

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
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("teachers.setupReadOnly")}
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <School className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("teachers.settings.title")}</h3>
          </div>

          {showPrefs && (
            <div className="space-y-4 text-start">
              <div>
                <label className={FORM_LABEL} htmlFor="teacher-idPrefix">{t("teachers.settings.idPrefix")}</label>
                <Input
                  id="teacher-idPrefix"
                  name="teacher-idPrefix"
                  value={settingsDraft.idPrefix || ""}
                  onChange={(event) => upd("idPrefix", event.target.value)}
                />
              </div>

              <ToggleRow
                label={t("teachers.settings.autoGenerateId")}
                value={settingsDraft.autoGenerateId}
                onChange={(v) => upd("autoGenerateId", v)}
              />

              <ToggleRow
                label={t("teachers.settings.requireContactLink")}
                value={settingsDraft.requireContactLink}
                onChange={(v) => upd("requireContactLink", v)}
              />

              <div>
                <label className={FORM_LABEL} htmlFor="teacher-defaultSpecialization">{t("teachers.settings.defaultSpecialization")}</label>
                <FormSelect
                  id="teacher-defaultSpecialization"
                  value={settingsDraft.defaultSpecialization}
                  onChange={(specialization) => upd("defaultSpecialization", specialization)}
                  options={specializationOptions}
                />
              </div>
            </div>
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={wrappedFieldsEditor}
              isCoreField={(tabId, key) => INITIAL_TEACHERS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              isLockedTab={(tabKey) => tabKey.toLowerCase() === "basic"}
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
        </section>
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
