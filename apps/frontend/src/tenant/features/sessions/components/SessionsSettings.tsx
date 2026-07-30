import React, { useMemo, useState } from "react";
import { Save, Calendar } from "lucide-react";
import {
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
  SESSIONS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SESSION_TYPES } from "@/lib/data/sessionsData";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { SessionsSettingsPreferences } from "@/tenant/features/sessions/components/SessionsSettingsPreferences";

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
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: SESSIONS_TAB_REGISTRY,
  });
  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const settingsSubTabs = useMemo(
    () =>
      SESSIONS_MODULE_MANIFEST.setupSubTabs.map((key, index) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
        order: index,
      })),
    [t],
  );

  const [sub, setSub] = useState<string>(() => settingsSubTabs[0]?.key || "fields");
  const showFields = sub === "fields";
  const showPrefs = sub === "preferences";

  const handleSave = async (): Promise<void> => {
    try {
      await saveSettingsAsync();
      notify.success(t("sessions.settings.saved"));
    } catch (error) {
      notify.error(t("settings.serverSaveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />

      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("sessions.setupReadOnly")}
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
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
              editor={fieldsEditor}
              isCoreField={(tabId, key) => INITIAL_SESSIONS_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
              onStateChange={() => setSaved(false)}
            />
          )}

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={() => { void handleSave(); }}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saved ? t("settings.savedBadge") : t("common.save")}</span>
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}
