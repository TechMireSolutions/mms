import React, { useState, useEffect } from "react";
import { Save, Calendar } from "lucide-react";
import {
  type SessionsSettings as SessionsSettingsType,
  DEFAULT_SESSIONS_SETTINGS,
  DEFAULT_SESSIONS_FIELD_DEFS,
  getSortedFields,
  type ModuleCustomField,
  type ModuleFieldDef,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useSessionConfig";
import { SESSION_TYPES } from "../../lib/data/sessionsData";
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import DraggableFieldList from "../ui/DraggableFieldList";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";


interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

/**
 * A reusable toggle switch component.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
        style={{
          width: 40,
          height: 22,
          background: value ? "hsl(var(--primary))" : "hsl(var(--border))",
          borderRadius: 999,
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s"
        }}
      >
        <span
          style={{
            width: 17,
            height: 17,
            top: 2.5,
            left: value ? 19 : 3,
            position: "absolute",
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }}
        />
      </button>
    </div>
  );
}

interface SessionsSettingsProps {
  mode?: "fields" | "preferences";
}

/**
 * Component for configuring sessions settings.
 * Allows editing session duration, session type defaults, overlays, archiving, and alerts.
 */
export default function SessionsSettings({ mode }: SessionsSettingsProps): React.JSX.Element {
  const { settings, types, updateSettings } = useSessionConfig();
  const [data, setData] = useState<SessionsSettingsType>(settings);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setData(settings);
  }, [settings]);

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  const upd = <K extends keyof SessionsSettingsType>(f: K, v: SessionsSettingsType[K]): void => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleSave = (): void => {
    updateSettings(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showPrefs = !mode || mode === "preferences";
  const showFields = !mode || mode === "fields";

  const fields = data.fields || DEFAULT_SESSIONS_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_SESSIONS_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(DEFAULT_SESSIONS_FIELD_DEFS, fieldOrder, fields, customFields);

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    upd("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_SESSIONS_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_SESSIONS_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "required", !cfg.required);
    } else {
      const updated = customFields.map(f => f.id === id ? { ...f, required: !f.required } : f);
      upd("customFields", updated);
    }
  };

  const handleReorder = (reordered: ModuleFieldDef[]) => {
    upd("fieldOrder", reordered.map(f => f.id));
  };

  const handleCustomFieldsChange = (newFields: CustomFieldConfig[]) => {
    const coreIds = DEFAULT_SESSIONS_FIELD_DEFS.map(f => f.id);
    const newIds = newFields.map(f => f.key);
    const kept = fieldOrder.filter((id) => coreIds.includes(id) || newIds.includes(id));
    const added = newIds.filter((id) => !kept.includes(id));

    setData((d) => ({
      ...d,
      customFields: newFields.map(f => ({ ...f, id: f.key })) as unknown as ModuleCustomField[],
      fieldOrder: [...kept, ...added]
    }));
    setSaved(false);
  };

  const enabledSet = new Set(Object.keys(fields).filter(k => fields[k].enabled));
  const requiredSet = new Set(Object.keys(fields).filter(k => fields[k].required));

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
              <input
                id="defaultDuration"
                type="number"
                className={FORM_INPUT}
                value={data.defaultDuration}
                onChange={(e) => upd("defaultDuration", e.target.value)}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="defaultSessionType">Default Session Type</label>
              <select
                id="defaultSessionType"
                className={`${FORM_INPUT} cursor-pointer`}
                value={data.defaultSessionType}
                onChange={(e) => upd("defaultSessionType", e.target.value)}
              >
                {typeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="academicYear">Academic Year</label>
              <input
                id="academicYear"
                type="text"
                className={FORM_INPUT}
                value={data.academicYear}
                onChange={(e) => upd("academicYear", e.target.value)}
                placeholder="2025-2026"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="sessionStart">Session Starts (Month)</label>
              <select
                id="sessionStart"
                className={`${FORM_INPUT} cursor-pointer`}
                value={data.sessionStart}
                onChange={(e) => upd("sessionStart", e.target.value)}
              >
                {["january", "february", "march", "april", "may", "june",
                  "july", "august", "september", "october", "november", "december"].map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle
              label="Allow Overlapping Sessions"
              description="Multiple active sessions can run at the same time"
              value={data.allowOverlap}
              onChange={(v) => upd("allowOverlap", v)}
            />
            <Toggle
              label="Auto-archive Old Sessions"
              description="Completed sessions are automatically archived"
              value={data.archiveOldSessions}
              onChange={(v) => upd("archiveOldSessions", v)}
            />
            <Toggle
              label="Require Budget Plan"
              description="Session must have a budget before activation"
              value={data.requireBudget}
              onChange={(v) => upd("requireBudget", v)}
            />
            <Toggle
              label="Timetable Conflict Check"
              description="Warn when class schedules overlap"
              value={data.timetableConflictCheck}
              onChange={(v) => upd("timetableConflictCheck", v)}
            />
            <Toggle
              label="Notify on Session Start"
              description="Send notification when a new session begins"
              value={data.notifyOnSessionStart}
              onChange={(v) => upd("notifyOnSessionStart", v)}
            />

            <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
                <p className="text-[11px] text-muted-foreground">Select how sessions are displayed in work view</p>
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => upd("defaultViewLayout", "list")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    (data.defaultViewLayout || "cards") === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  List View
                </button>
                <button
                  type="button"
                  onClick={() => upd("defaultViewLayout", "cards")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    (data.defaultViewLayout || "cards") === "cards"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Card Grid
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Session Form Fields</h3>
            <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
              <span>— drag to reorder</span>
            </span>
          </div>

          <DraggableFieldList
            tabId="sessions-fields"
            fields={orderedFields}
            enabledSet={enabledSet}
            requiredSet={requiredSet}
            onToggleEnabled={handleToggleEnabled}
            onToggleRequired={handleToggleRequired}
            onReorder={handleReorder}
          />

          <div className="border-t border-border pt-4">
            <CustomFieldsBuilder
              fields={customFields as unknown as CustomFieldConfig[]}
              droppableId="custom-fields-sessions"
              onChange={handleCustomFieldsChange}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saved ? "Saved!" : "Save Settings"}</span>
      </button>
    </section>
  );
}
