import React, { useState } from "react";
import { Save, Star } from "lucide-react";
import { getObject, saveObject } from "../../lib/db";
import {
  type HasanatSettings as HasanatSettingsData,
  DEFAULT_HASANAT_SETTINGS,
  DEFAULT_HASANAT_FIELD_DEFS,
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
  onChange: (val: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 text-left">
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

interface HasanatSettingsProps {
  mode?: "fields" | "preferences";
}

export default function HasanatSettings({ mode }: HasanatSettingsProps): React.ReactElement {
  const [data, setData] = useState<HasanatSettingsData>(() => getObject<HasanatSettingsData>("hasanat_settings", DEFAULT_HASANAT_SETTINGS));
  const [saved, setSaved] = useState<boolean>(false);

  const upd = (f: keyof HasanatSettingsData, v: HasanatSettingsData[keyof HasanatSettingsData]) => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const showPrefs = !mode || mode === "preferences";
  const showFields = !mode || mode === "fields";

  const fields = data.fields || DEFAULT_HASANAT_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_HASANAT_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(DEFAULT_HASANAT_FIELD_DEFS, fieldOrder, fields, customFields);

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    upd("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_HASANAT_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_HASANAT_FIELD_DEFS.some(f => f.id === id)) {
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
    const coreIds = DEFAULT_HASANAT_FIELD_DEFS.map(f => f.id);
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
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="hasanat-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
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
              <input
                id="points-per-unit"
                type="number"
                className={FORM_INPUT}
                value={data.pointsPerUnit || 10}
                onChange={(e) => upd("pointsPerUnit", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="pt-1">
            <Toggle
              label="Auto-approve Payouts"
              description="Automatically approve rewards redemption without manual review"
              value={data.autoApprovePayouts || false}
              onChange={(v) => upd("autoApprovePayouts", v)}
            />
          </div>
        </div>
      )}

      {showFields && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Card Distribution Form Fields</h3>
            <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
              <span>— drag to reorder</span>
            </span>
          </div>

          <DraggableFieldList
            tabId="hasanat-fields"
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
              droppableId="custom-fields-hasanat"
              onChange={handleCustomFieldsChange}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          saveObject("hasanat_settings", data);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
      >
        <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
      </button>
    </section>
  );
}
