import React, { useState, useEffect } from "react";
import { Save, Calendar } from "lucide-react";
import {
  type SessionsSettings as SessionsSettingsType,
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useSessionConfig";
import { SESSION_TYPES } from "../../lib/data/sessionsData";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormSelect } from "../ui/FormSelect";
import { Switch } from "../ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleFieldsSetup } from "../ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

interface SessionsSettingsProps {
  mode?: "fields" | "preferences";
}

export function SessionsSettings({ mode }: SessionsSettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, types, updateSettings } = useSessionConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [defaultDuration, setDefaultDuration] = useState(settings.defaultDuration);
  const [defaultSessionType, setDefaultSessionType] = useState(settings.defaultSessionType);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [sessionStart, setSessionStart] = useState(settings.sessionStart);
  const [allowOverlap, setAllowOverlap] = useState(settings.allowOverlap);
  const [archiveOldSessions, setArchiveOldSessions] = useState(settings.archiveOldSessions);
  const [requireBudget, setRequireBudget] = useState(settings.requireBudget);
  const [timetableConflictCheck, setTimetableConflictCheck] = useState(settings.timetableConflictCheck);
  const [notifyOnSessionStart, setNotifyOnSessionStart] = useState(settings.notifyOnSessionStart);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: SESSIONS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setDefaultDuration(settings.defaultDuration);
    setDefaultSessionType(settings.defaultSessionType);
    setAcademicYear(settings.academicYear);
    setSessionStart(settings.sessionStart);
    setAllowOverlap(settings.allowOverlap);
    setArchiveOldSessions(settings.archiveOldSessions);
    setRequireBudget(settings.requireBudget);
    setTimetableConflictCheck(settings.timetableConflictCheck);
    setNotifyOnSessionStart(settings.notifyOnSessionStart);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreTabKeys = new Set(SESSIONS_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreTabKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...SESSIONS_TAB_REGISTRY,
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

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const handleSave = (): void => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: SessionsSettingsType = {
      ...settings,
      defaultDuration,
      defaultSessionType,
      academicYear,
      sessionStart,
      allowOverlap,
      archiveOldSessions,
      requireBudget,
      timetableConflictCheck,
      notifyOnSessionStart,
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
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Sessions Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="defaultDuration">Default Duration (months)</label>
              <Input
                id="defaultDuration"
                type="number"
                value={defaultDuration}
                onChange={(event) => { setDefaultDuration(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="defaultSessionType">Default Session Type</label>
              <FormSelect
                id="defaultSessionType"
                value={defaultSessionType}
                onChange={(value) => { setDefaultSessionType(value); setSaved(false); }}
                options={typeOptions}
                className="w-full"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="academicYear">Academic Year</label>
              <Input
                id="academicYear"
                type="text"
                value={academicYear}
                onChange={(event) => { setAcademicYear(event.target.value); setSaved(false); }}
                placeholder="2025-2026"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="sessionStart">Session Starts (Month)</label>
              <FormSelect
                id="sessionStart"
                value={sessionStart}
                onChange={(value) => { setSessionStart(value); setSaved(false); }}
                options={["january", "february", "march", "april", "may", "june",
                  "july", "august", "september", "october", "november", "december"].map((month) => ({
                    value: month,
                    label: month.charAt(0).toUpperCase() + month.slice(1)
                  }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle
              label="Allow Overlapping Sessions"
              description="Multiple active sessions can run at the same time"
              value={allowOverlap}
              onChange={(value) => { setAllowOverlap(value); setSaved(false); }}
            />
            <Toggle
              label="Auto-archive Old Sessions"
              description="Completed sessions are automatically archived"
              value={archiveOldSessions}
              onChange={(value) => { setArchiveOldSessions(value); setSaved(false); }}
            />
            <Toggle
              label="Require Budget Plan"
              description="Session must have a budget before activation"
              value={requireBudget}
              onChange={(value) => { setRequireBudget(value); setSaved(false); }}
            />
            <Toggle
              label="Timetable Conflict Check"
              description="Warn when class schedules overlap"
              value={timetableConflictCheck}
              onChange={(value) => { setTimetableConflictCheck(value); setSaved(false); }}
            />
            <Toggle
              label="Notify on Session Start"
              description="Send notification when a new session begins"
              value={notifyOnSessionStart}
              onChange={(value) => { setNotifyOnSessionStart(value); setSaved(false); }}
            />

            <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
                <p className="text-[11px] text-muted-foreground">Select how sessions are displayed in work view</p>
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                <Button
                  variant="ghost"
                  onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (defaultViewLayout || "cards") === "list"
                      ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  List View
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (defaultViewLayout || "cards") === "cards"
                      ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  Card Grid
                </Button>
              </div>
            </div>
          </div>
        </>
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
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? "Saved!" : "Save Settings"}</span>
        </Button>
      </footer>
    </section>
  );
}
