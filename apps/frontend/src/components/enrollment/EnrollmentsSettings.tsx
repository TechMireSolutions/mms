import React, { useState } from "react";
import { Save, ClipboardList } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";
import {
  type EnrollmentsSettings as EnrollmentsSettingsData,
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  getSortedFields,
  type ModuleCustomField,
  type ModuleFieldDef,
} from "@mms/shared";
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

interface EnrollmentsSettingsProps {
  mode?: "fields" | "preferences";
}

/**
 * Component for configuring enrollment settings.
 * Allows editing maximum class size, waitlists, approval flows, deadlines, and reminders.
 */
export default function EnrollmentsSettings({ mode }: EnrollmentsSettingsProps): React.JSX.Element {
  const [data, setData] = useState<EnrollmentsSettingsData>(() =>
    getObject<EnrollmentsSettingsData>("enrollments_settings", DEFAULT_ENROLLMENTS_SETTINGS)
  );
  const [saved, setSaved] = useState<boolean>(false);

  const upd = <K extends keyof EnrollmentsSettingsData>(f: K, v: EnrollmentsSettingsData[K]): void => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleSave = (): void => {
    saveObject("enrollments_settings", data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showPrefs = !mode || mode === "preferences";
  const showFields = !mode || mode === "fields";

  const fields = data.fields || DEFAULT_ENROLLMENTS_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_ENROLLMENTS_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(DEFAULT_ENROLLMENTS_FIELD_DEFS, fieldOrder, fields, customFields);

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    upd("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_ENROLLMENTS_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_ENROLLMENTS_FIELD_DEFS.some(f => f.id === id)) {
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
    const coreIds = DEFAULT_ENROLLMENTS_FIELD_DEFS.map(f => f.id);
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
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Enrollments Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">Max Students Per Class</label>
              <input
                id="maxStudentsPerClass"
                type="number"
                className={FORM_INPUT}
                value={data.maxStudentsPerClass}
                onChange={(e) => upd("maxStudentsPerClass", e.target.value)}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="dropDeadlineDays">Drop Deadline (days after enroll)</label>
              <input
                id="dropDeadlineDays"
                type="number"
                className={FORM_INPUT}
                value={data.dropDeadlineDays}
                onChange={(e) => upd("dropDeadlineDays", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle
              label="Enable Waitlist"
              description="Allow students to join a waitlist when class is full"
              value={data.waitlistEnabled}
              onChange={(v) => upd("waitlistEnabled", v)}
            />
            <Toggle
              label="Require Eligibility Check"
              description="Run eligibility rules before confirming enrollment"
              value={data.requireEligibilityCheck}
              onChange={(v) => upd("requireEligibilityCheck", v)}
            />
            <Toggle
              label="Auto-assign to Class"
              description="System automatically places student in best available class"
              value={data.autoAssignClass}
              onChange={(v) => upd("autoAssignClass", v)}
            />
            <Toggle
              label="Enrollment Requires Approval"
              description="Admin must approve each enrollment"
              value={data.enrollmentApproval}
              onChange={(v) => upd("enrollmentApproval", v)}
            />
            <Toggle
              label="Allow Class Transfers"
              description="Students can be transferred between classes"
              value={data.allowTransfers}
              onChange={(v) => upd("allowTransfers", v)}
            />
            <Toggle
              label="Re-enrollment Reminder"
              description="Remind guardians when re-enrollment period opens"
              value={data.reenrollmentReminder}
              onChange={(v) => upd("reenrollmentReminder", v)}
            />
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Enrollment Wizard Fields</h3>
            <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
              <span>— drag to reorder</span>
            </span>
          </div>

          <DraggableFieldList
            tabId="enrollments-fields"
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
              droppableId="custom-fields-enrollments"
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
