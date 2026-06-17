import React, { useState } from "react";
import {
  DollarSign, Calendar, Plus, Pencil, Trash2,
  CheckCircle2, Lock, Clock, Save, RotateCcw, BookOpen
} from "lucide-react";
import { CURRENCIES, Account, AccountingSettings as SettingsType, FiscalYear } from '@/lib/data/accountingData';
import {
  DEFAULT_ACCOUNT_FIELD_DEFS,
  DEFAULT_ACCOUNTING_SETTINGS,
  getSortedFields,
  type ModuleCustomField,
} from "@mms/shared";
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import DraggableFieldList from "../ui/DraggableFieldList";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "../ui/formStyles";

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"];
const DECIMAL_SEPARATORS = [
  { label: "Period  1,000.00", value: "period" },
  { label: "Comma   1.000,00", value: "comma" },
];
const FY_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface SectionCardProps {
  title: string;
  icon?: React.ElementType | null;
  children: React.ReactNode;
}

/**
 * SectionCard component.
 */
function SectionCard({ title, icon: Icon, children }: SectionCardProps) {
  return (
    <section aria-label={title} className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
        {Icon && <Icon className="w-4 h-4 text-primary" aria-hidden="true" />}
        <h3 className="text-sm font-bold text-foreground m-0">{title}</h3>
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

/**
 * Field component for forms.
 */
function Field({ label, hint = undefined, children }: FieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground m-0">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 m-0">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

/**
 * Toggle component.
 */
function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button 
      type="button" 
      role="switch" 
      aria-checked={checked}
      aria-label={ariaLabel || "Toggle setting"}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted border border-border"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} aria-hidden="true" />
    </button>
  );
}

interface FYModalProps {
  open: boolean;
  initial: Partial<FiscalYear> | null;
  onSave: (fy: FiscalYear) => void;
  onClose: () => void;
}

function FYModal({ open, initial, onSave, onClose }: FYModalProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<FiscalYear>>(initial || { label: "", startDate: "", endDate: "", status: "upcoming" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setForm(initial || { label: "", startDate: "", endDate: "", status: "upcoming" });
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.label?.trim()) e.label = "Label is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate >= form.endDate) e.endDate = "End must be after start";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({
      ...form,
      id: isEdit ? form.id : `fy${Date.now()}`,
    } as FiscalYear);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Financial Year" : "Add Financial Year"}
      icon={Calendar}
      size="md"
      error={Object.values(errors)}
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="fy-label" className={FORM_LABEL}>Label *</label>
          <input
            id="fy-label"
            value={form.label || ""}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. FY 2026–27"
            className={FORM_INPUT}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fy-start" className={FORM_LABEL}>Start Date *</label>
            <DatePicker
              id="fy-start"
              value={form.startDate || ""}
              onChange={(val) => setForm({ ...form, startDate: val })}
              required
            />
          </div>
          <div>
            <label htmlFor="fy-end" className={FORM_LABEL}>End Date *</label>
            <DatePicker
              id="fy-end"
              value={form.endDate || ""}
              onChange={(val) => setForm({ ...form, endDate: val })}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="fy-status" className={FORM_LABEL}>Status</label>
          <select
            id="fy-status"
            value={form.status || "upcoming"}
            onChange={(e) => setForm({ ...form, status: e.target.value as FiscalYear["status"] | "upcoming" })}
            className={`${FORM_INPUT} cursor-pointer`}
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </FormModal>
  );
}

const FY_STATUS: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  active:   { color: "bg-success/15 text-success border-success/30", icon: CheckCircle2, label: "Active" },
  closed:   { color: "bg-muted text-muted-foreground border-border",       icon: Lock,         label: "Closed" },
  upcoming: { color: "bg-info/15 text-info border-info/30",          icon: Clock,        label: "Upcoming" },
};

interface AccountingSettingsProps {
  accounts: Account[];
  settings: SettingsType;
  onSaveSettings: (settings: SettingsType) => void;
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (fiscalYears: FiscalYear[]) => void;
  mode?: "fields" | "preferences";
}

/**
 * AccountingSettings component.
 * 
 * @param {AccountingSettingsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function AccountingSettings({ accounts, settings, onSaveSettings, fiscalYears, onSaveFiscalYears, mode }: AccountingSettingsProps) {
  const [local,   setLocal]   = useState<SettingsType>(settings);
  const [saved,   setSaved]   = useState(false);
  const [fyModal, setFyModal] = useState<Partial<FiscalYear> | null>(null);

  const set = <K extends keyof SettingsType>(key: K, val: SettingsType[K]) => setLocal((s) => ({ ...s, [key]: val }));

  const handleSave = () => {
    onSaveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm("Reset settings to current saved values?")) setLocal(settings);
  };

  const handleSaveFY = (fy: FiscalYear) => {
    const updated = fiscalYears.find((f) => f.id === fy.id)
      ? fiscalYears.map((f) => f.id === fy.id ? fy : f)
      : [...fiscalYears, fy];
    onSaveFiscalYears(updated);
    setFyModal(null);
  };

  const handleDeleteFY = (id: string) => {
    const fy = fiscalYears.find((f) => f.id === id);
    if (fy?.status === "active") { alert("Cannot delete the active financial year."); return; }
    if (confirm("Delete this financial year?")) onSaveFiscalYears(fiscalYears.filter((f) => f.id !== id));
  };

  const activeCur = CURRENCIES.find((c) => c.code === local.currency);
  const fmtDate   = (d: string) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const showPrefs = !mode || mode === "preferences";
  const showFields = !mode || mode === "fields";

  const fields = local.fields || DEFAULT_ACCOUNTING_SETTINGS.fields || {};
  const customFields = local.customFields || [];
  const fieldOrder = local.fieldOrder || DEFAULT_ACCOUNTING_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(
    DEFAULT_ACCOUNT_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields
  );

  const updateFieldConfig = (fieldKey: string, prop: "enabled" | "required", value: boolean) => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === "enabled" && !value) {
      updatedFieldObj.required = false;
    }
    set("fields", { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string) => {
    if (DEFAULT_ACCOUNT_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "enabled", !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string) => {
    if (DEFAULT_ACCOUNT_FIELD_DEFS.some(f => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, "required", !cfg.required);
    } else {
      const updated = customFields.map(f => f.id === id ? { ...f, required: !f.required } : f);
      set("customFields", updated);
    }
  };

  const handleReorder = (reordered: any[]) => {
    set("fieldOrder", reordered.map(f => f.id));
  };

  const handleCustomFieldsChange = (newFields: CustomFieldConfig[]) => {
    const coreIds = DEFAULT_ACCOUNT_FIELD_DEFS.map(f => f.id);
    const newIds = newFields.map(f => f.key);
    const kept = fieldOrder.filter((id) => coreIds.includes(id) || newIds.includes(id));
    const added = newIds.filter((id) => !kept.includes(id));

    setLocal((d) => ({
      ...d,
      customFields: newFields.map(f => ({ ...f, id: f.key })) as unknown as ModuleCustomField[],
      fieldOrder: [...kept, ...added]
    }));
  };

  const enabledSet = new Set(Object.keys(fields).filter(k => fields[k].enabled));
  const requiredSet = new Set(Object.keys(fields).filter(k => fields[k].required));

  return (
    <div className="space-y-6">

      {showPrefs && (
        <>
          {/* Organisation */}
          <SectionCard title="Organisation" icon={null}>
            <Field label="Organisation Name" hint="Displayed on reports and printed documents">
              <input value={local.organizationName || ""} aria-label="Organisation Name" onChange={(e) => set("organizationName", e.target.value)} className={FORM_INPUT} />
            </Field>
          </SectionCard>

          {/* Currency & Display */}
          <SectionCard title="Currency & Display" icon={DollarSign}>
            <Field label="Base Currency" hint="All transactions recorded in this currency">
              <select aria-label="Base Currency" value={local.currency} onChange={(e) => {
                const cur = CURRENCIES.find(c => c.code === e.target.value);
                set("currency", e.target.value);
                if (cur) set("currencySymbol", cur.symbol);
              }} className={FORM_INPUT}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} – {c.name}</option>
                ))}
              </select>
              {activeCur && (
                <p className="text-xs text-muted-foreground mt-1 m-0">
                  Symbol: <span className="font-bold">{activeCur.symbol}</span> · Code: <span className="font-mono font-bold">{activeCur.code}</span>
                </p>
              )}
            </Field>
            <Field label="Date Format">
              <select aria-label="Date Format" value={local.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} className={FORM_INPUT}>
                {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Number Format">
              <select aria-label="Number Format" value={local.decimalSeparator} onChange={(e) => set("decimalSeparator", e.target.value as "period" | "comma")} className={FORM_INPUT}>
                {DECIMAL_SEPARATORS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Decimal Places">
              <select aria-label="Decimal Places" value={local.decimalPlaces} onChange={(e) => set("decimalPlaces", parseInt(e.target.value))} className={`${FORM_INPUT} w-32`}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </SectionCard>

          {/* Financial Years */}
          <SectionCard title="Financial Years" icon={Calendar}>
            <Field label="FY Start Month" hint="Month when each financial year begins">
              <select aria-label="FY Start Month" value={local.fyStartMonth} onChange={(e) => set("fyStartMonth", e.target.value)} className={`${FORM_INPUT} w-48`}>
                {FY_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <div className="mt-4">
              <header className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Configured Financial Years</h4>
                <button type="button" onClick={() => setFyModal({ label: "", startDate: "", endDate: "", status: "upcoming" })}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Year
                </button>
              </header>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <caption className="sr-only">Financial Years Configuration</caption>
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Label</th>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Period</th>
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Status</th>
                      <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...fiscalYears].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((fy) => {
                      const st = FY_STATUS[fy.status] || FY_STATUS.upcoming;
                      const StatusIcon = st.icon;
                      return (
                        <tr key={fy.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{fy.label}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDate(fy.startDate)} → {fmtDate(fy.endDate)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                              <StatusIcon className="w-2.5 h-2.5" aria-hidden="true" /> {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" aria-label={`Edit ${fy.label}`} onClick={() => setFyModal({ ...fy })}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <button type="button" aria-label={`Delete ${fy.label}`} onClick={() => handleDeleteFY(fy.id)} disabled={fy.status === "active"}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          {/* Journal Entry Rules */}
          <SectionCard title="Journal Entry Rules" icon={null}>
            <Field label="Require Narration" hint="Enforce description on every entry">
              <Toggle ariaLabel="Require Narration" checked={local.requireNarration} onChange={(v) => set("requireNarration", v)} />
            </Field>
            <Field label="Allow Editing Posted Entries" hint="If off, posted entries are locked (recommended)">
              <Toggle ariaLabel="Allow Editing Posted Entries" checked={local.allowEditPosted} onChange={(v) => set("allowEditPosted", v)} />
              {local.allowEditPosted && (
                <p className="text-xs text-warning mt-1 font-semibold m-0" role="alert">⚠ Enabling this breaks audit integrity. Use reversals instead.</p>
              )}
            </Field>
            <Field label="Auto-post Draft Entries" hint="Automatically post entries saved as draft">
              <Toggle ariaLabel="Auto-post Draft Entries" checked={local.autoPostDrafts} onChange={(v) => set("autoPostDrafts", v)} />
            </Field>
          </SectionCard>

          {/* Account Numbering */}
          <SectionCard title="Account Numbering" icon={null}>
            <Field label="Default Code Length" hint="Number of digits for new account codes">
              <select aria-label="Default Code Length" value={local.accountCodeLength} onChange={(e) => set("accountCodeLength", parseInt(e.target.value))} className={`${FORM_INPUT} w-32`}>
                {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Retained Earnings Account" hint="Used for closing net surplus at year-end">
              <select aria-label="Retained Earnings Account" value={local.retainedEarningsAccount} onChange={(e) => set("retainedEarningsAccount", e.target.value)} className={FORM_INPUT}>
                <option value="">— None —</option>
                {accounts
                  .filter((a) => a.type === "Equity" && a.isActive !== false)
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
              </select>
            </Field>
          </SectionCard>
        </>
      )}

      {showFields && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="accounting-fields-title">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 id="accounting-fields-title" className="text-sm font-bold text-foreground">Chart of Accounts Form Fields</h3>
            <span className="text-xs text-muted-foreground ml-1">
              — drag to reorder
            </span>
          </div>

          <DraggableFieldList
            tabId="accounting-fields"
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
              droppableId="custom-fields-accounting"
              onChange={handleCustomFieldsChange}
            />
          </div>
        </section>
      )}

      {/* Save / Reset */}
      <footer className="flex items-center justify-between gap-4 pt-1">
        <button type="button" onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Discard Changes
        </button>
        <button type="button" onClick={handleSave}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            saved ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}>
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Saved!</> : <><Save className="w-3.5 h-3.5" aria-hidden="true" /> Save Settings</>}
        </button>
      </footer>

      <FYModal open={!!fyModal} initial={fyModal} onSave={handleSaveFY} onClose={() => setFyModal(null)} />
    </div>
  );
}
