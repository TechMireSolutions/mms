import React from "react";
import { Save, Calendar } from "lucide-react";
import {
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
} from "@mms/shared";
import { useSessionConfig } from "@/tenant/features/sessions/hooks/useSessionConfig";
import { SESSION_TYPES } from "@/lib/data/sessionsData";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface SessionsSettingsProps {
  mode?: "fields" | "preferences";
}

export function SessionsSettings({ mode }: SessionsSettingsProps): React.JSX.Element {
  const config = useSessionConfig();
  const { types } = config;
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: SESSIONS_TAB_REGISTRY,
  });

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const handleSave = (): void => {
    saveSettings();
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
                value={settingsDraft.defaultDuration || ""}
                onChange={(event) => upd("defaultDuration", event.target.value)}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="defaultSessionType">Default Session Type</label>
              <FormSelect
                id="defaultSessionType"
                value={settingsDraft.defaultSessionType}
                onChange={(value) => upd("defaultSessionType", value)}
                options={typeOptions}
                className="w-full"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="academicYear">Academic Year</label>
              <Input
                id="academicYear"
                type="text"
                value={settingsDraft.academicYear || ""}
                onChange={(event) => upd("academicYear", event.target.value)}
                placeholder="2025-2026"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="sessionStart">Session Starts (Month)</label>
              <FormSelect
                id="sessionStart"
                value={settingsDraft.sessionStart}
                onChange={(value) => upd("sessionStart", value)}
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
            <ToggleRow
              label="Allow Overlapping Sessions"
              description="Multiple active sessions can run at the same time"
              value={settingsDraft.allowOverlap}
              onChange={(value) => upd("allowOverlap", value)}
            />
            <ToggleRow
              label="Auto-archive Old Sessions"
              description="Completed sessions are automatically archived"
              value={settingsDraft.archiveOldSessions}
              onChange={(value) => upd("archiveOldSessions", value)}
            />
            <ToggleRow
              label="Require Budget Plan"
              description="Session must have a budget before activation"
              value={settingsDraft.requireBudget}
              onChange={(value) => upd("requireBudget", value)}
            />
            <ToggleRow
              label="Timetable Conflict Check"
              description="Warn when class schedules overlap"
              value={settingsDraft.timetableConflictCheck}
              onChange={(value) => upd("timetableConflictCheck", value)}
            />
            <ToggleRow
              label="Notify on Session Start"
              description="Send notification when a new session begins"
              value={settingsDraft.notifyOnSessionStart}
              onChange={(value) => upd("notifyOnSessionStart", value)}
            />

            <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
                <p className="text-[11px] text-muted-foreground">Select how sessions are displayed in work view</p>
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                <Button
                  variant="ghost"
                  onClick={() => upd("defaultViewLayout", "list")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (settingsDraft.defaultViewLayout || "cards") === "list"
                      ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  List View
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => upd("defaultViewLayout", "cards")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (settingsDraft.defaultViewLayout || "cards") === "cards"
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
