import React, { useEffect } from "react";
import { Calendar } from "lucide-react";
import { SESSIONS_MODULE_MANIFEST } from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
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
  const { canEditSetup } = useModulePermissions(SESSIONS_MODULE_MANIFEST);
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
    <div className="space-y-4 max-w-3xl text-start">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("sessions.setupReadOnly")} />
      ) : (
        <SectionCard title={t("sessions.settings.title")} icon={Calendar} accentColor="primary">
          <div className="space-y-4">
            <SessionsSettingsPreferences
              settingsDraft={settingsDraft}
              typeOptions={typeOptions}
              upd={upd}
            />

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
        </SectionCard>
      )}
    </div>
  );
});

export default SessionsSettings;
