import { type SessionsSettings as SessionsSettingsType } from "@mms/shared";
import React from "react";
import { Calendar } from "lucide-react";
import {
  SESSIONS_MODULE_MANIFEST,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SESSION_TYPES } from "@/lib/data/sessionsData";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SessionsSettingsPreferences } from "@/tenant/features/sessions/components/SessionsSettingsPreferences";
import { useSessionsSetupSaveActions } from "@/tenant/features/sessions/hooks/useSessionsSetupSaveActions";

export const SessionsSettings = React.memo(function SessionsSettings(): React.JSX.Element {
      const { t } = useTranslation();
      const { canEditSetup } = useModulePermissions(SESSIONS_MODULE_MANIFEST);
      const config = useSessionConfig();
      const { types } = config;
      const {
        settings,
        settingsDraft,
        saved,
        setSaved,
        upd,
        saveSettingsAsync,
      } = useModuleSettingsEditor<SessionsSettingsType>({
        config,
      });
      const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

      const {
        saving,
        isPrefsDirty,
        handleSave,
      } = useSessionsSetupSaveActions({
        settings,
        settingsDraft,
        setSaved,
        saveSettingsAsync,
      });

      const unsavedWarning = isPrefsDirty
        ? t("sessions.setup.unsavedPreferencesWarning")
        : undefined;

      return (
        <div className="space-y-4">
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
            </section>
          )}
        </div>
      );
    });
