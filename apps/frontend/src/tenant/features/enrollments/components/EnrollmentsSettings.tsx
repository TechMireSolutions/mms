import React, { useEffect, useMemo, useRef } from "react";
import { ClipboardList } from "lucide-react";
import {
  ENROLLMENTS_TAB_REGISTRY,
  INITIAL_ENROLLMENTS_FIELD_SEED,
  ENROLLMENTS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL, WORK_SURFACE } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "enrollments.setup.fields",
  preferences: "enrollments.setup.preferences",
};

export function EnrollmentsSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ENROLLMENTS_MODULE_MANIFEST);
  const config = useEnrollmentConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
    discardDrafts,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ENROLLMENTS_TAB_REGISTRY,
  });

  const wrappedFieldsEditor = useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: fieldsEditor.handleDeleteField,
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => ENROLLMENTS_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_ENROLLMENTS_FIELD_SEED,
        isLockedTab: (key) => key === "basic",
      }),
    [fieldsEditor],
  );

  const settingsSubTabs = useMemo(
    () =>
      ENROLLMENTS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
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

  const isFieldsDirty = !saved;
  const isPrefsDirty = !saved;
  const isDirty = !saved;

  useEffect(() => {
    dirtyRef.current.fields = isFieldsDirty;
    dirtyRef.current.prefs = isPrefsDirty;
  }, [isFieldsDirty, isPrefsDirty]);

  const handleSave = (): void => {
    saveSettings();
    notify.success(t("enrollments.settings.saved"));
  };

  const unsavedWarning = showFields
    ? t("enrollments.setup.unsavedFieldsWarning")
    : showPrefs
      ? t("enrollments.setup.unsavedPreferencesWarning")
      : undefined;

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={subTabs.sub}
        onChange={subTabs.handleSubTabChange}
      />

      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("enrollments.setupReadOnly")} />
      ) : (
        <section className={`${WORK_SURFACE} p-5 space-y-4`}>
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("enrollments.settings.title")}</h3>
          </div>

          {showPrefs && (
            <div className="space-y-4 text-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">
                    {t("enrollments.settings.maxStudentsPerClass")}
                  </label>
                  <Input
                    id="maxStudentsPerClass"
                    type="number"
                    value={settingsDraft.maxStudentsPerClass || ""}
                    onChange={(event) => upd("maxStudentsPerClass", event.target.value)}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="dropDeadlineDays">
                    {t("enrollments.settings.dropDeadlineDays")}
                  </label>
                  <Input
                    id="dropDeadlineDays"
                    type="number"
                    value={settingsDraft.dropDeadlineDays || ""}
                    onChange={(event) => upd("dropDeadlineDays", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <ToggleRow
                  label={t("enrollments.settings.waitlistEnabled")}
                  description={t("enrollments.settings.waitlistEnabledHint")}
                  value={settingsDraft.waitlistEnabled}
                  onChange={(value) => upd("waitlistEnabled", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.requireEligibilityCheck")}
                  description={t("enrollments.settings.requireEligibilityCheckHint")}
                  value={settingsDraft.requireEligibilityCheck}
                  onChange={(value) => upd("requireEligibilityCheck", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.autoAssignClass")}
                  description={t("enrollments.settings.autoAssignClassHint")}
                  value={settingsDraft.autoAssignClass}
                  onChange={(value) => upd("autoAssignClass", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.enrollmentApproval")}
                  description={t("enrollments.settings.enrollmentApprovalHint")}
                  value={settingsDraft.enrollmentApproval}
                  onChange={(value) => upd("enrollmentApproval", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.allowTransfers")}
                  description={t("enrollments.settings.allowTransfersHint")}
                  value={settingsDraft.allowTransfers}
                  onChange={(value) => upd("allowTransfers", value)}
                />
                <ToggleRow
                  label={t("enrollments.settings.reenrollmentReminder")}
                  description={t("enrollments.settings.reenrollmentReminderHint")}
                  value={settingsDraft.reenrollmentReminder}
                  onChange={(value) => upd("reenrollmentReminder", value)}
                />
              </div>
            </div>
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={wrappedFieldsEditor}
              isCoreField={(tabId, key) => INITIAL_ENROLLMENTS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              onStateChange={() => setSaved(false)}
            />
          )}

          <ModuleSetupSaveFooter
            dirty={isDirty}
            saving={false}
            saved={saved}
            unsavedWarning={unsavedWarning}
            saveLabel={t("common.save")}
            savedLabel={t("settings.savedBadge")}
            onSave={handleSave}
          />
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
            ? t("enrollments.setup.discardUnsavedFieldsConfirm")
            : t("enrollments.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={subTabs.handleConfirmDiscard}
      />
    </div>
  );
}

