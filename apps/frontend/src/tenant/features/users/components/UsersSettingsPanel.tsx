import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Save } from "lucide-react";
import {
  type UsersSettings as UsersSettingsData,
  USERS_TAB_REGISTRY,
  INITIAL_USERS_FIELD_SEED,
} from "@mms/shared";
import { useUsersConfig } from "@/tenant/features/users/hooks/useUsersConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { cn } from "@/lib/utils";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

interface UsersSettingsPanelProps {
  mode?: "fields" | "preferences";
}

export function UsersSettingsPanel({ mode }: UsersSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSettings } = useUsersConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(settings.allowSelfRegistration);
  const [requireEmailVerification, setRequireEmailVerification] = useState(settings.requireEmailVerification);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: USERS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setAllowSelfRegistration(settings.allowSelfRegistration);
    setRequireEmailVerification(settings.requireEmailVerification);

    const coreKeys = new Set(USERS_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...USERS_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings]);

  const handleSave = (): void => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
      ...tab,
      enabled: fieldsEditor.enabledTabs.has(tab.key)
    }));

    const updatedSettings: UsersSettingsData = {
      ...settings,
      allowSelfRegistration,
      requireEmailVerification,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };

    updateSettings(updatedSettings);
    setSaved(true);
    notify.success(t("users.settingsSaved"), { description: t("users.settingsSavedDesc") });
    setTimeout(() => setSaved(false), 2500);
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 pl-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{t("users.settingsPrefsTitle")}</h3>
      </div>

      {showPrefs && (
        <div className="space-y-2 pt-1">
          <Toggle
            label={t("users.selfRegistration")}
            description={t("users.selfRegistrationDesc")}
            value={allowSelfRegistration || false}
            onChange={(v) => { setAllowSelfRegistration(v); setSaved(false); }}
          />
          <Toggle
            label={t("users.emailVerification")}
            description={t("users.emailVerificationDesc")}
            value={requireEmailVerification || false}
            onChange={(v) => { setRequireEmailVerification(v); setSaved(false); }}
          />
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_USERS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={cn("ml-auto", saved && "bg-success hover:bg-success/90 text-success-foreground")}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? "Saved!" : "Save Settings"}</span>
        </Button>
      </footer>
    </Card>
  );
}
