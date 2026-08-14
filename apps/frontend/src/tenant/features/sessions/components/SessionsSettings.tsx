import { type SessionsSettings } from "@mms/shared";
import React, { useEffect, useMemo, useRef } from "react";
import { Calendar } from "lucide-react";
import {
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
  SESSIONS_MODULE_MANIFEST,
  isSessionSystemFormField,
  isSessionSeedFormTab,
  isSessionLockedEnabledTab,
  type AppTranslationKey,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SESSION_TYPES } from "@/lib/data/sessionsData";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SessionsSettingsPreferences } from "@/tenant/features/sessions/components/SessionsSettingsPreferences";
import { useSessionsSetupSaveActions } from "@/tenant/features/sessions/hooks/useSessionsSetupSaveActions";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "sessions.setup.fields",
  preferences: "sessions.setup.preferences",
};

export function SessionsSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const config = useSessionConfig();
  const { types } = config;
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
    discardDrafts,
  } = useModuleSettingsEditor<SessionsSettings>({
    config,
    tabRegistry: SESSIONS_TAB_REGISTRY,
  });
  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const wrappedFieldsEditor = useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: fieldsEditor.handleDeleteField,
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => SESSIONS_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_SESSIONS_FIELD_SEED,
        isLockedTab: isSessionLockedEnabledTab,
      }),
    [fieldsEditor],
  );

  const settingsSubTabs = useMemo(
    () =>
      SESSIONS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
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

  const {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
  } = useSessionsSetupSaveActions({
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

  const unsavedWarning = showFields
    ? t("sessions.setup.unsavedFieldsWarning")
    : showPrefs
      ? t("sessions.setup.unsavedPreferencesWarning")
      : undefined;

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={subTabs.sub}
        onChange={subTabs.handleSubTabChange}
      />

      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("sessions.setupReadOnly")} />
      ) : (
        <section className={`${WORK_SURFACE} p-5 space-y-4`}>
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("sessions.settings.title")}</h3>
          </div>

          {showPrefs && (
            <SessionsSettingsPreferences
              settingsDraft={settingsDraft}
              typeOptions={typeOptions}
              upd={upd}
            />
          )}

          {showFields && (
            <ModuleFieldsSetup
              editor={wrappedFieldsEditor}
              isCoreField={isSessionSystemFormField}
              isProtectedTab={isSessionSeedFormTab}
              isLockedTab={isSessionLockedEnabledTab}
              onStateChange={() => setSaved(false)}
            />
          )}

          <ModuleSetupSaveFooter
            dirty={isDirty}
            saving={saving}
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
            ? t("sessions.setup.discardUnsavedFieldsConfirm")
            : t("sessions.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={subTabs.handleConfirmDiscard}
      />
    </div>
  );
}
