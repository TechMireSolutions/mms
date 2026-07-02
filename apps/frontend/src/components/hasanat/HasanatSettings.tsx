import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Save, Star } from "lucide-react";
import {
  type HasanatSettings as HasanatSettingsData,
  HASANAT_TAB_REGISTRY,
  INITIAL_HASANAT_FIELD_SEED,
} from "@mms/shared";
import { useHasanatConfig } from "@/hooks/useHasanatConfig";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ModuleFieldsSetup } from "../ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`${label}: ${description || ""}`}
      />
    </div>
  );
}

interface HasanatSettingsProps {
  mode?: "fields" | "preferences";
}

export function HasanatSettings({ mode }: HasanatSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useHasanatConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [pointsPerUnit, setPointsPerUnit] = useState(settings.pointsPerUnit);
  const [autoApprovePayouts, setAutoApprovePayouts] = useState(settings.autoApprovePayouts);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: HASANAT_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setPointsPerUnit(settings.pointsPerUnit);
    setAutoApprovePayouts(settings.autoApprovePayouts);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreTabKeys = new Set(HASANAT_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreTabKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...HASANAT_TAB_REGISTRY,
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

  const handleSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: HasanatSettingsData = {
      ...settings,
      pointsPerUnit,
      autoApprovePayouts,
      defaultViewLayout,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };

    updateSettings(nextSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                value={pointsPerUnit || 10}
                onChange={(event) => { setPointsPerUnit(Number(event.target.value)); setSaved(false); }}
              />
            </div>
          </div>
          <div className="pt-1">
            <Toggle
              label="Auto-approve Payouts"
              description="Automatically approve rewards redemption without manual review"
              value={autoApprovePayouts || false}
              onChange={(value) => { setAutoApprovePayouts(value); setSaved(false); }}
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
