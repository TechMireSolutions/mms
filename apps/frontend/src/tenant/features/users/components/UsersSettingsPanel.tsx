import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { INITIAL_USERS_FIELD_SEED, USERS_TAB_REGISTRY, type UsersSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import type { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";

type UsersFieldsEditor = ReturnType<typeof useModuleSettingsEditor<UsersSettings>>["fieldsEditor"];

export interface UsersSettingsPanelProps {
  mode: "fields" | "preferences";
  settingsDraft: UsersSettings;
  fieldsEditor: UsersFieldsEditor;
  saved: boolean;
  saving: boolean;
  isDirty: boolean;
  upd: <K extends keyof UsersSettings>(field: K, value: UsersSettings[K]) => void;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  onSave: () => void | Promise<void>;
}

/** Presentational Users Fields/Preferences panel — editor owned by Setup tier. */
export function UsersSettingsPanel({
  mode,
  settingsDraft,
  fieldsEditor,
  saved,
  saving,
  isDirty,
  upd,
  setSaved,
  onSave,
}: UsersSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  const wrappedFieldsEditor = useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: fieldsEditor.handleDeleteField,
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => USERS_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_USERS_FIELD_SEED,
        isLockedTab: (key) => key === "basic",
      }),
    [fieldsEditor],
  );

  const unsavedWarning = showFields
    ? t("users.setup.unsavedFieldsWarning")
    : showPrefs
      ? t("users.setup.unsavedPreferencesWarning")
      : undefined;

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 ps-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{t("users.settingsPrefsTitle")}</h3>
      </div>

      {showPrefs && (
        <div className="space-y-2 pt-1">
          <ToggleRow
            label={t("users.selfRegistration")}
            description={t("users.selfRegistrationDesc")}
            value={settingsDraft.allowSelfRegistration || false}
            onChange={(value) => upd("allowSelfRegistration", value)}
          />
          <ToggleRow
            label={t("users.emailVerification")}
            description={t("users.emailVerificationDesc")}
            value={settingsDraft.requireEmailVerification || false}
            onChange={(value) => upd("requireEmailVerification", value)}
          />
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={(tabId, key) => INITIAL_USERS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <ModuleSetupSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("users.settingsSaveBtn")}
        savedLabel={t("users.settingsSavedShort")}
        onSave={onSave}
      />
    </Card>
  );
}

