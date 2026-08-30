import React, { useEffect } from "react";
import { Calendar } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { SessionsSettingsPreferences } from "@/tenant/features/sessions/components/SessionsSettingsPreferences";
import { useSessionsSetupPanelState } from "@/tenant/features/sessions/hooks/useSessionsSetupPanelState";

export interface SessionsSettingsProps {
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const SessionsSettings = React.memo(function SessionsSettings({
  onPrefsDirtyChange,
}: SessionsSettingsProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    settingsDraft,
    typeOptions,
    upd,
    saved,
    saving,
    isPrefsDirty,
    handleSave,
  } = useSessionsSetupPanelState();

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("sessions.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <SectionCard
        title={t("sessions.settings.title")}
        icon={Calendar}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <SessionsSettingsPreferences
          settingsDraft={settingsDraft}
          typeOptions={typeOptions}
          upd={upd}
        />
      </SectionCard>

      <ModuleSetupSaveFooter
        dirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={handleSave}
      />
    </div>
  );
});

export default SessionsSettings;
