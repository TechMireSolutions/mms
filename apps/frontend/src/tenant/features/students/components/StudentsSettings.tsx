import React from "react";
import { Save, GraduationCap } from "lucide-react";
import {
  type StudentsSettings,
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

export default function StudentsSettings({ mode }: { mode?: "fields" | "preferences" }): React.ReactElement {
  const config = useStudentConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: STUDENT_TAB_REGISTRY,
    defaultEnabledTabs: DEFAULT_STUDENT_ENABLED_TABS,
    defaultRequiredTabs: DEFAULT_STUDENT_REQUIRED_TABS,
  });

  const handleSave = (): void => {
    saveSettings(undefined, {
      version: 2,
      columnRegistry: settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
    } as any);
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
                  value={settingsDraft.grNumberTemplate || ""}
                  onChange={(event) => upd("grNumberTemplate", event.target.value)}
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
                  value={settingsDraft.grNumberDigits || 4}
                  onChange={(event) => upd("grNumberDigits", Number(event.target.value))}
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">e.g., 4 is "0001", 3 is "001"</span>
              </div>
            </div>
            <ToggleRow
              label="Restart Sequence Annually"
              description="Reset GR number sequence to 0001 at the beginning of each calendar year"
              value={settingsDraft.grNumberRestartAnnually ?? true}
              onChange={(v) => upd("grNumberRestartAnnually", v)}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/40" role="group" aria-label="Student registry feature flags toggles">
            <ToggleRow label="Auto-generate Student ID" description="System assigns unique ID on registration" value={settingsDraft.autoGenerateId} onChange={(v) => upd("autoGenerateId", v)} />
            <ToggleRow label="Require Guardian Contact" description="Student must have at least one guardian linked" value={settingsDraft.requireGuardian} onChange={(v) => upd("requireGuardian", v)} />
            <ToggleRow label="Require Photo" description="Student profile photo is mandatory" value={settingsDraft.requirePhoto} onChange={(v) => upd("requirePhoto", v)} />
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
                onClick={() => upd("defaultViewLayout", "list")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  (settingsDraft.defaultViewLayout || "list") === "list"
                    ? "bg-card text-foreground shadow-sm hover:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List View
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => upd("defaultViewLayout", "cards")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  settingsDraft.defaultViewLayout === "cards"
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
