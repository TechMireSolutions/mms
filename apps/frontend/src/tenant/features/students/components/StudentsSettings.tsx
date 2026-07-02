import React, { useEffect, useState } from "react";
import { Save, GraduationCap } from "lucide-react";
import {
  type StudentsSettings,
  type FieldDefinition,
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
} from "@mms/shared";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/tenant/features/students/hooks/useStudentConfig";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (enabled: boolean) => void;
  ariaLabel?: string;
}

function Toggle({ label, description, value, onChange, ariaLabel }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1.5 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={ariaLabel || label}
      />
    </div>
  );
}

export default function StudentsSettings({ mode }: { mode?: "fields" | "preferences" }): React.ReactElement {
  const { settings, updateSettings } = useStudentConfig();
  const [saved, setSaved] = useState<boolean>(false);

  const settingsFields = (settings.fields as Record<string, FieldDefinition[]>) || {};

  // General Preferences state
  const [idPrefix, setIdPrefix] = useState(settings.idPrefix);
  const [autoGenerateId, setAutoGenerateId] = useState(settings.autoGenerateId);
  const [requireGuardian, setRequireGuardian] = useState(settings.requireGuardian);
  const [requirePhoto, setRequirePhoto] = useState(settings.requirePhoto);
  const [defaultGender, setDefaultGender] = useState(settings.defaultGender);
  const [maxAge, setMaxAge] = useState(settings.maxAge);
  const [minAge, setMinAge] = useState(settings.minAge);
  const [allowSiblingDiscount, setAllowSiblingDiscount] = useState(settings.allowSiblingDiscount);
  const [grNumberTemplate, setGrNumberTemplate] = useState(settings.grNumberTemplate);
  const [grNumberDigits, setGrNumberDigits] = useState(settings.grNumberDigits);
  const [grNumberRestartAnnually, setGrNumberRestartAnnually] = useState(settings.grNumberRestartAnnually);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  // Fields and Tabs state managed by DRY hook
  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: STUDENT_TAB_REGISTRY,
    initialFields: settingsFields,
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS)),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS)),
  });

  useEffect(() => {
    if (!settings) return;
    // Keep internal state updated when context settings reload/change
    setIdPrefix(settings.idPrefix);
    setAutoGenerateId(settings.autoGenerateId);
    setRequireGuardian(settings.requireGuardian);
    setRequirePhoto(settings.requirePhoto);
    setDefaultGender(settings.defaultGender);
    setMaxAge(settings.maxAge);
    setMinAge(settings.minAge);
    setAllowSiblingDiscount(settings.allowSiblingDiscount);
    setGrNumberTemplate(settings.grNumberTemplate);
    setGrNumberDigits(settings.grNumberDigits);
    setGrNumberRestartAnnually(settings.grNumberRestartAnnually);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreKeys = new Set(STUDENT_TAB_REGISTRY.map(t => t.key));
    const customTabs = (settings.formTabs || []).filter(t => !coreKeys.has(t.key));
    const updatedTabs = [
      ...STUDENT_TAB_REGISTRY,
      ...customTabs
    ].map(t => ({
      ...t,
      enabled: t.key === "basic" ? true : (settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS).includes(t.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      (settings.fields as Record<string, FieldDefinition[]>) || {},
      settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS,
      settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS
    );
  }, [settings]);

  const handleSave = (): void => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
      ...tab,
      enabled: fieldsEditor.enabledTabs.has(tab.key)
    }));

    const updatedSettings: StudentsSettings = {
      ...settings,
      idPrefix,
      autoGenerateId,
      requireGuardian,
      requirePhoto,
      defaultGender,
      maxAge,
      minAge,
      allowSiblingDiscount,
      grNumberTemplate,
      grNumberDigits,
      grNumberRestartAnnually,
      defaultViewLayout,
      version: 2,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      fields: fieldsEditor.buildFieldsMap(),
      formTabs: updatedFormTabs,
      columnRegistry: settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
    };

    updateSettings(updatedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showFields = mode === "fields";
  const showPrefs = mode === "preferences";

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="students-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="students-settings-title" className="text-[13px] font-bold text-foreground">Students Module Settings</h3>
      </div>

      {showPrefs && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">General Register (GR) Number Settings</h4>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <label htmlFor="gr-template" className={FORM_LABEL}>GR Number Template</label>
                <Input
                  id="gr-template"
                  className={FORM_INPUT}
                  value={grNumberTemplate || ""}
                  onChange={(event) => { setGrNumberTemplate(event.target.value); setSaved(false); }}
                  placeholder="e.g. {seq}-{year}"
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">Use placeholders: <code>{`{seq}`}</code>, <code>{`{year}`}</code></span>
              </div>
              <div>
                <label htmlFor="gr-digits" className={FORM_LABEL}>Sequence Digits</label>
                <Input
                  id="gr-digits"
                  type="number"
                  min="1"
                  max="8"
                  className={FORM_INPUT}
                  value={grNumberDigits || 4}
                  onChange={(event) => { setGrNumberDigits(Number(event.target.value)); setSaved(false); }}
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">e.g., 4 is "0001", 3 is "001"</span>
              </div>
            </div>
            <Toggle
              label="Restart Sequence Annually"
              description="Reset GR number sequence to 0001 at the beginning of each calendar year"
              value={grNumberRestartAnnually ?? true}
              onChange={(v) => { setGrNumberRestartAnnually(v); setSaved(false); }}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/40" role="group" aria-label="Student registry feature flags toggles">
            <Toggle label="Auto-generate Student ID" description="System assigns unique ID on registration" value={autoGenerateId} onChange={(v) => { setAutoGenerateId(v); setSaved(false); }} />
            <Toggle label="Require Guardian Contact" description="Student must have at least one guardian linked" value={requireGuardian} onChange={(v) => { setRequireGuardian(v); setSaved(false); }} />
            <Toggle label="Require Photo" description="Student profile photo is mandatory" value={requirePhoto} onChange={(v) => { setRequirePhoto(v); setSaved(false); }} />
          </div>

          <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
              <p className="text-[11px] text-muted-foreground">Select how students are displayed in work view</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  (defaultViewLayout || "list") === "list"
                    ? "bg-card text-foreground shadow-sm hover:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List View
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  defaultViewLayout === "cards"
                    ? "bg-card text-foreground shadow-sm hover:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Card Grid
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_STUDENT_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
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
    </section>
  );
}
