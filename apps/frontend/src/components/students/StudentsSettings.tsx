import React, { useState } from "react";
import { Save, GraduationCap, GripVertical, Check } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getObject, saveObject } from "../../lib/db";
import {
  type StudentsSettings,
  DEFAULT_STUDENTS_SETTINGS,
  type StudentCustomField,
  getSortedStudentFields,
  DEFAULT_STUDENT_FIELD_DEFS
} from "@mms/shared";
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

/**
 * Custom switch toggle component.
 *
 * @returns Component layout.
 */
function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${label}: ${description || ""}`}
        onClick={() => onChange(!value)}
        style={{ width: 40, height: 22, background: value ? "hsl(var(--primary))" : "hsl(var(--border))", borderRadius: 999, position: "relative", flexShrink: 0, transition: "background 0.2s" }}
      >
        <span style={{ width: 17, height: 17, top: 2.5, left: value ? 19 : 3, position: "absolute", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}

/**
 * Panel managing rules and defaults for the student registry.
 *
 * @returns The StudentsSettings component.
 */
export default function StudentsSettings({ mode }: { mode?: "fields" | "preferences" }): React.ReactElement {
  const [data, setData] = useState<StudentsSettings>(() => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS));
  const [saved, setSaved] = useState<boolean>(false);

  const upd = (f: keyof StudentsSettings, v: StudentsSettings[keyof StudentsSettings]) => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const fields = data.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_STUDENTS_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedStudentFields(fieldOrder, fields, customFields);

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    upd("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_STUDENT_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_STUDENT_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "required", !cfg.required);
    } else {
      const updated = customFields.map(f => f.id === id ? { ...f, required: !f.required } : f);
      upd("customFields", updated);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(orderedFields);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    upd("fieldOrder", reordered.map(f => f.id));
  };

  const handleCustomFieldsChange = (newFields: CustomFieldConfig[]) => {
    const coreIds = DEFAULT_STUDENT_FIELD_DEFS.map(f => f.id);
    const newIds = newFields.map(f => f.key);
    
    // Sync fieldOrder
    const kept = fieldOrder.filter((id) => coreIds.includes(id) || newIds.includes(id));
    const added = newIds.filter((id) => !kept.includes(id));
    
    setData(d => ({
      ...d,
      customFields: newFields.map(f => ({ ...f, id: f.key })) as unknown as StudentCustomField[],
      fieldOrder: [...kept, ...added]
    }));
    setSaved(false);
  };

  const showFields = !mode || mode === "fields";
  const showPrefs = !mode || mode === "preferences";

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="students-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="students-settings-title" className="text-[13px] font-bold text-foreground">Students Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">General Register (GR) Number Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gr-template" className={LABEL}>GR Number Template</label>
                <input
                  id="gr-template"
                  className={INPUT}
                  value={data.grNumberTemplate || ""}
                  onChange={(e) => upd("grNumberTemplate", e.target.value)}
                  placeholder="e.g. {seq}-{year}"
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">Use placeholders: <code>{`{seq}`}</code>, <code>{`{year}`}</code></span>
              </div>
              <div>
                <label htmlFor="gr-digits" className={LABEL}>Sequence Digits</label>
                <input
                  id="gr-digits"
                  type="number"
                  min="1"
                  max="8"
                  className={INPUT}
                  value={data.grNumberDigits || 4}
                  onChange={(e) => upd("grNumberDigits", Number(e.target.value))}
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">e.g., 4 is "0001", 3 is "001"</span>
              </div>
            </div>
            <Toggle
              label="Restart Sequence Annually"
              description="Reset GR number sequence to 0001 at the beginning of each calendar year"
              value={data.grNumberRestartAnnually ?? true}
              onChange={(v) => upd("grNumberRestartAnnually", v)}
            />
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Student registry feature flags toggles">
            <Toggle label="Auto-generate Student ID" description="System assigns unique ID on registration" value={data.autoGenerateId} onChange={(v) => upd("autoGenerateId", v)} />
            <Toggle label="Require Guardian Contact" description="Student must have at least one guardian linked" value={data.requireGuardian} onChange={(v) => upd("requireGuardian", v)} />
            <Toggle label="Require Photo" description="Student profile photo is mandatory" value={data.requirePhoto} onChange={(v) => upd("requirePhoto", v)} />
          </div>

          <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
              <p className="text-[11px] text-muted-foreground">Select how students are displayed in operations view</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => upd("defaultViewLayout", "list")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  (data.defaultViewLayout || "list") === "list"
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
                  data.defaultViewLayout === "cards"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Card Grid
              </button>
            </div>
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Student Form Fields</h3>
          <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
            <span>— drag </span>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span> to reorder</span>
          </span>
        </div>

        {/* ── Identity section (Always On) ── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden text-left">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Identity</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Always On</span>
              </div>
              <p className="text-xs text-muted-foreground">Core student fields + your custom fields</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {orderedFields.filter(f => fields[f.id]?.enabled ?? true).length}/{orderedFields.length}
            </span>
          </div>

          <div className="p-4 space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="student-fields-droppable">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                    {orderedFields.map((field, index) => {
                      const isCustom = !DEFAULT_STUDENT_FIELD_DEFS.some(df => df.id === field.id);
                      const isEnabled = fields[field.id]?.enabled ?? true;
                      const isRequired = fields[field.id]?.required ?? false;

                      return (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(drag, snapshot) => {
                            const { style, ...draggableProps } = drag.draggableProps;
                            return (
                            <div
                              ref={drag.innerRef}
                              {...draggableProps}
                              style={style as React.CSSProperties}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all select-none text-xs
                                ${
                                  snapshot.isDragging
                                    ? "shadow-lg border-primary/40 bg-primary/5"
                                    : isEnabled
                                    ? "border-border bg-card"
                                    : "border-border/40 bg-muted/20 opacity-55"
                                }`}
                            >
                              <span
                                {...drag.dragHandleProps}
                                aria-label="Drag to reorder field"
                                className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>

                              {/* Enable Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleEnabled(field.id)}
                                  disabled={isCustom}
                                  className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isEnabled ? "bg-primary border-primary" : "border-border bg-background"}`}
                                >
                                {isEnabled && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-foreground">{field.label}</p>
                                  {isCustom && field.type && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50">
                                      Custom · {field.type}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Required Toggle */}
                              {isEnabled && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleRequired(field.id)}
                                  className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all
                                    ${
                                      isRequired
                                        ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"
                                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                  {isRequired ? "Required" : "Optional"}
                                </button>
                              )}
                            </div>
                          );
                          }}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Custom Fields Builder nested at bottom of card */}
            <div className="border-t border-border pt-4">
              <CustomFieldsBuilder
                fields={customFields as unknown as CustomFieldConfig[]}
                droppableId="custom-fields-students"
                onChange={handleCustomFieldsChange}
              />
            </div>
          </div>
        </section>
      </div>
      )}

      <div className="pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={() => {
            saveObject("students_settings", data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </section>
  );
}
