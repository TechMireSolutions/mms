import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Save } from "lucide-react";
import {
  USERS_TAB_REGISTRY,
  INITIAL_USERS_FIELD_SEED,
} from "@mms/shared";
import { useUsersConfig } from "@/tenant/features/users/hooks/useUsersConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { cn } from "@/lib/utils";

interface UsersSettingsPanelProps {
  mode?: "fields" | "preferences";
}

export function UsersSettingsPanel({ mode }: UsersSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const config = useUsersConfig();
  const {
    settings,
    fieldsEditor,
    saved,
    setSaved,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: USERS_TAB_REGISTRY,
  });

  // Prefs state
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(settings.allowSelfRegistration);
  const [requireEmailVerification, setRequireEmailVerification] = useState(settings.requireEmailVerification);

  useEffect(() => {
    if (!settings) return;
    setAllowSelfRegistration(settings.allowSelfRegistration);
    setRequireEmailVerification(settings.requireEmailVerification);
  }, [settings]);

  const handleSave = (): void => {
    saveSettings({
      allowSelfRegistration,
      requireEmailVerification,
    });
    notify.success(t("users.settingsSaved"), { description: t("users.settingsSavedDesc") });
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
          <ToggleRow
            label={t("users.selfRegistration")}
            description={t("users.selfRegistrationDesc")}
            value={allowSelfRegistration || false}
            onChange={(v) => { setAllowSelfRegistration(v); setSaved(false); }}
          />
          <ToggleRow
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
          <span>{saved ? t("users.settingsSavedShort") : t("users.settingsSaveBtn")}</span>
        </Button>
      </footer>
    </Card>
  );
}
