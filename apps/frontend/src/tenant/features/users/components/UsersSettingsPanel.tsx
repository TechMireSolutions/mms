import React from "react";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import {
  type UsersSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";

export interface UsersSettingsPanelProps {
  settingsDraft: UsersSettings;
  saved: boolean;
  saving: boolean;
  isDirty: boolean;
  upd: <K extends keyof UsersSettings>(field: K, value: UsersSettings[K]) => void;
  onSave: () => void | Promise<void>;
}

/** Presentational Users Preferences panel — editor owned by Setup tier. */
export function UsersSettingsPanel({
  settingsDraft,
  saved,
  saving,
  isDirty,
  upd,
  onSave,
}: UsersSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();

  const unsavedWarning = isDirty
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


