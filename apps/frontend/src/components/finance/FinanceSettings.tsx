import React, { useState, useEffect } from "react";
import { Save, DollarSign } from "lucide-react";
import { useFinanceConfig } from "@/hooks/useFinanceConfig";
import {
  type FinanceSettings as FinanceSettingsData,
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
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

/**
 * Custom switch toggle component.
 *
 * @returns Component layout.
 */
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

interface FinanceSettingsProps {
  mode?: "fields" | "preferences";
}

/**
 * Finance module settings configuration panel.
 *
 * @returns The FinanceSettings component.
 */
export default function FinanceSettings({ mode }: FinanceSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useFinanceConfig();
  const [data, setData] = useState<FinanceSettingsData>(() => settings);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setData(settings);
  }, [settings]);

  const upd = (f: keyof FinanceSettingsData, v: FinanceSettingsData[keyof FinanceSettingsData]) => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const showPrefs = !mode || mode === "preferences";
  const showFields = !mode || mode === "fields";

  const fields = data.fields || DEFAULT_FINANCE_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_FINANCE_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(DEFAULT_FINANCE_FIELD_DEFS, fieldOrder, fields, customFields);

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    upd("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_FINANCE_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_FINANCE_FIELD_DEFS.some(f => f.id === id)) {
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
    const coreIds = DEFAULT_FINANCE_FIELD_DEFS.map(f => f.id);
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

  const ALL_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"];
  const toggleMethod = (m: string) => {
    const cur = data.paymentMethods;
    const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
    upd("paymentMethods", next);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="finance-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="finance-settings-title" className="text-[13px] font-bold text-foreground">Finance Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="finance-currency" className={FORM_LABEL}>Currency</label>
              <select
                id="finance-currency"
                className={`${FORM_INPUT} cursor-pointer`}
                value={data.currency}
                onChange={(e) => upd("currency", e.target.value)}
              >
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-prefix" className={FORM_LABEL}>Invoice Prefix</label>
              <input
                id="inv-prefix"
                className={FORM_INPUT}
                value={data.invoicePrefix}
                onChange={(e) => upd("invoicePrefix", e.target.value)}
                placeholder="INV"
              />
            </div>
            <div>
              <label htmlFor="due-days" className={FORM_LABEL}>Default Due Days</label>
              <input
                id="due-days"
                type="number"
                className={FORM_INPUT}
                value={data.dueDays}
                onChange={(e) => upd("dueDays", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="late-fee" className={FORM_LABEL}>Late Fee (%)</label>
              <input
                id="late-fee"
                type="number"
                className={FORM_INPUT}
                value={data.lateFeePercent}
                onChange={(e) => upd("lateFeePercent", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tax-rate" className={FORM_LABEL}>Tax Rate (%)</label>
              <input
                id="tax-rate"
                type="number"
                className={FORM_INPUT}
                value={data.taxRate}
                onChange={(e) => upd("taxRate", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="reminder-days" className={FORM_LABEL}>Reminder Days Before Due</label>
              <input
                id="reminder-days"
                type="number"
                className={FORM_INPUT}
                value={data.reminderDaysBefore}
                onChange={(e) => upd("reminderDaysBefore", e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className={FORM_LABEL}>Accepted Payment Methods</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select payment methods">
              {ALL_METHODS.map((m) => {
                const active = data.paymentMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      active ? "bg-primary/10 border-primary/30 text-primary font-bold" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Financial registry feature flags toggles">
            <Toggle label="Auto-generate Invoices" description="Automatically create invoices on enrollment" value={data.autoGenerateInvoice} onChange={(v) => upd("autoGenerateInvoice", v)} />
            <Toggle label="Send Invoice by Email" description="Email invoice to guardian on creation" value={data.sendInvoiceEmail} onChange={(v) => upd("sendInvoiceEmail", v)} />
            <Toggle label="Allow Partial Payment" description="Accept payments less than the full amount" value={data.allowPartialPayment} onChange={(v) => upd("allowPartialPayment", v)} />
            <Toggle label="Require Approval for Discounts" description="Discounts need admin approval before applying" value={data.requireApproval} onChange={(v) => upd("requireApproval", v)} />
            <Toggle label="Overdue Reminders" description="Send reminders for overdue invoices" value={data.overdueReminder} onChange={(v) => upd("overdueReminder", v)} />
            <Toggle label="Fee Reminders" description="Send notifications when fees are due or overdue" value={data.feeReminders} onChange={(v) => upd("feeReminders", v)} />
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Payment Form Fields</h3>
            <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
              <span>— drag to reorder</span>
            </span>
          </div>

          <DraggableFieldList
            tabId="finance-fields"
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
              droppableId="custom-fields-finance"
              onChange={handleCustomFieldsChange}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          updateSettings(data);
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
