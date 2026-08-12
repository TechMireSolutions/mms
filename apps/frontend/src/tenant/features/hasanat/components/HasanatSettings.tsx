import React from "react";
import { Card } from "@/components/ui/card";
import { Save, Star } from "lucide-react";
import {
  HASANAT_TAB_REGISTRY,
  INITIAL_HASANAT_FIELD_SEED,
} from "@mms/shared";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { wrapModuleSetupFieldsEditor } from "@/lib/setup/wrapModuleSetupFieldsEditor";
import { notify } from "@/lib/notify";

interface HasanatSettingsProps {
  mode?: "fields" | "preferences";
}

export function HasanatSettings({ mode }: HasanatSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const config = useHasanatConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: HASANAT_TAB_REGISTRY,
  });

  const handleSave = async () => {
    try {
      await saveSettingsAsync();
      notify.success(t("hasanat.settings.saved"));
    } catch (error: unknown) {
      notify.error(t("hasanat.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  const wrappedFieldsEditor = React.useMemo(
    () =>
      wrapModuleSetupFieldsEditor({
        fieldsEditor,
        handleDeleteField: fieldsEditor.handleDeleteField,
        handleDeleteTab: fieldsEditor.handleDeleteTab,
        getSeedTab: (key) => HASANAT_TAB_REGISTRY.find((tab) => tab.key === key),
        initialFieldSeed: INITIAL_HASANAT_FIELD_SEED,
        isLockedTab: (key) => key === "basic",
      }),
    [fieldsEditor],
  );

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 ps-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="hasanat-settings-title" className="text-sm font-bold text-foreground">
          {showFields ? t("hasanat.settings.titleFields") : t("hasanat.settings.titlePreferences")}
        </h3>
      </div>

      {showPrefs && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="points-per-unit" className={FORM_LABEL}>{t("hasanat.settings.pointsPerUnit")}</label>
              <Input
                id="points-per-unit"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.pointsPerUnit || 10}
                onChange={(event) => upd("pointsPerUnit", Number(event.target.value))}
              />
            </div>
          </div>
          <div className="pt-1">
            <ToggleRow
              label={t("hasanat.settings.autoApprovePayouts")}
              description={t("hasanat.settings.autoApprovePayoutsHint")}
              value={settingsDraft.autoApprovePayouts || false}
              onChange={(value) => upd("autoApprovePayouts", value)}
            />
          </div>
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={wrappedFieldsEditor}
          isCoreField={(tabId, key) => INITIAL_HASANAT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={() => { void handleSave(); }}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("hasanat.settings.btnSaved") : t("hasanat.settings.btnSave")}
        </Button>
      </footer>
    </Card>
  );
}
