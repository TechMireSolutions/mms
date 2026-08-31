import React from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Shield } from "lucide-react";
import {
  type UsersSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";

export interface UsersSettingsPanelProps {
  settingsDraft: UsersSettings;
  saved: boolean;
  saving: boolean;
  isDirty: boolean;
  upd: <K extends keyof UsersSettings>(field: K, value: UsersSettings[K]) => void;
  onSave: () => void | Promise<void>;
}

export const UsersSettingsPanel = (function UsersSettingsPanel({
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
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        accentColor="primary"
        icon={Shield}
        title={t("users.settingsPrefsTitle")}
        className={SETUP_SECTION_CARD_CLASS}
      >
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
      </SectionCard>

      <ModuleSetupSaveFooter
        dirty={isDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={onSave}
      />
    </div>
  );
});
