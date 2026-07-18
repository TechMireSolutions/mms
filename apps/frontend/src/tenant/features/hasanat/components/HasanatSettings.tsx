import React from "react";
import { Card } from "@/components/ui/card";
import { Save, Star } from "lucide-react";
import {
  HASANAT_TAB_REGISTRY,
  INITIAL_HASANAT_FIELD_SEED,
} from "@mms/shared";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface HasanatSettingsProps {
  mode?: "fields" | "preferences";
}

export function HasanatSettings({ mode }: HasanatSettingsProps): React.ReactElement {
  const config = useHasanatConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: HASANAT_TAB_REGISTRY,
  });

  const handleSave = () => {
    saveSettings();
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 pl-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="hasanat-settings-title" className="text-[13px] font-bold text-foreground">Hasanat Cards Settings</h3>
      </div>

      {showPrefs && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="points-per-unit" className={FORM_LABEL}>Points Per Card/Unit</label>
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
              label="Auto-approve Payouts"
              description="Automatically approve rewards redemption without manual review"
              value={settingsDraft.autoApprovePayouts || false}
              onChange={(value) => upd("autoApprovePayouts", value)}
            />
          </div>
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_HASANAT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </Card>
  );
}
