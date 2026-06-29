import React, { useState, useEffect } from "react";
import {
  DollarSign, Calendar, Plus, Pencil, Trash2,
  CheckCircle2, Lock, Clock, Save, BookOpen, Info
} from "lucide-react";
import { Account, AccountingSettings as SettingsType, FiscalYear } from '@/lib/data/accountingData';
import {
  DEFAULT_CURRENCIES,
  ACCOUNTING_TAB_REGISTRY,
  INITIAL_ACCOUNTING_FIELD_SEED,
  type FieldDefinition,
  type TabDefinition,
} from "@mms/shared";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useAccountingConfig } from "@/hooks/useAccountingConfig";
import { CustomFieldsBuilder, CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import { CoreFieldEditorList } from "../ui/CoreFieldEditorList";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { DatePicker } from "../ui/DatePicker";
import { FormModal } from "../ui/FormModal";
import { FORM_LABEL } from "../ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormSelect } from "../ui/FormSelect";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Modal } from "../ui/Modal";

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

function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <Switch 
      checked={checked} 
      onCheckedChange={onChange} 
      aria-label={ariaLabel || "Toggle setting"} 
    />
  );
}

interface FYModalProps {
  open: boolean;
  initial: Partial<FiscalYear> | null;
  onSave: (fiscalYear: FiscalYear) => void;
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
    const validationErrors: Record<string, string> = {};
    if (!form.label?.trim()) validationErrors.label = "Label is required";
    if (!form.startDate) validationErrors.startDate = "Start date is required";
    if (!form.endDate) validationErrors.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate >= form.endDate) validationErrors.endDate = "End must be after start";
    return validationErrors;
  };

  const handleSave = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
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
      error={Object.values(errors)}
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="financial-year-label" className={FORM_LABEL}>Label *</label>
          <Input
            id="financial-year-label"
            value={form.label || ""}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder="e.g. FY 2026–27"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="financial-year-start" className={FORM_LABEL}>Start Date *</label>
            <DatePicker
              id="financial-year-start"
              value={form.startDate || ""}
              onChange={(startDateValue) => setForm({ ...form, startDate: startDateValue })}
              required
            />
          </div>
          <div>
            <label htmlFor="financial-year-end" className={FORM_LABEL}>End Date *</label>
            <DatePicker
              id="financial-year-end"
              value={form.endDate || ""}
              onChange={(endDateValue) => setForm({ ...form, endDate: endDateValue })}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="financial-year-status" className={FORM_LABEL}>Status</label>
          <FormSelect
            id="financial-year-status"
            value={form.status || "upcoming"}
            onChange={(statusValue) => setForm({ ...form, status: statusValue as FiscalYear["status"] | "upcoming" })}
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" }
            ]}
          />
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
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (fiscalYears: FiscalYear[]) => void;
  mode?: "fields" | "preferences";
}

function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort((firstField, secondField) => (orderByKey[firstField.key] ?? 9999) - (orderByKey[secondField.key] ?? 9999)) as FieldDefinition[];
}

function syncOrder(previousOrder: string[], newFieldIds: string[]): string[] {
  const kept = previousOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

export function AccountingSettings({ accounts, fiscalYears, onSaveFiscalYears, mode }: AccountingSettingsProps) {
  const currencies = useLiveCollection<any>("currencies", DEFAULT_CURRENCIES);
  const { settings, updateSettings } = useAccountingConfig();
  const [saved, setSaved] = useState(false);
  const [fyModal, setFyModal] = useState<Partial<FiscalYear> | null>(null);

  // Prefs state
  const [organizationName, setOrganizationName] = useState(settings.organizationName);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [decimalSeparator, setDecimalSeparator] = useState(settings.decimalSeparator);
  const [decimalPlaces, setDecimalPlaces] = useState(settings.decimalPlaces);
  const [fyStartMonth, setFyStartMonth] = useState(settings.fyStartMonth);
  const [requireNarration, setRequireNarration] = useState(settings.requireNarration);
  const [allowEditPosted, setAllowEditPosted] = useState(settings.allowEditPosted);
  const [autoPostDrafts, setAutoPostDrafts] = useState(settings.autoPostDrafts);
  const [accountCodeLength, setAccountCodeLength] = useState(settings.accountCodeLength);
  const [retainedEarningsAccount, setRetainedEarningsAccount] = useState(settings.retainedEarningsAccount);

  const {
    formTabs,
    setFormTabs,
    tabFields,
    setTabFields,
    enabledTabs,
    setEnabledTabs,
    requiredTabs,
    setRequiredTabs,
    tabFieldEnabled,
    setTabFieldEnabled,
    tabFieldRequired,
    setTabFieldRequired,
    tabFieldUnique,
    setTabFieldUnique,
    tabFieldDefaultValues,
    setTabFieldDefaultValues,
    tabFieldPermissions,
    setTabFieldPermissions,
    tabFieldOrder,
    setTabFieldOrder,
    toggleTabEnabled,
    toggleTabRequired,
    toggleFieldEnabled,
    toggleFieldRequired,
    toggleFieldUnique,
    handleReorder,
  } = useModuleFieldsEditor({
    initialTabs: ACCOUNTING_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState("");

  useEffect(() => {
    if (!settings) return;
    setOrganizationName(settings.organizationName);
    setCurrency(settings.currency);
    setCurrencySymbol(settings.currencySymbol);
    setDateFormat(settings.dateFormat);
    setDecimalSeparator(settings.decimalSeparator);
    setDecimalPlaces(settings.decimalPlaces);
    setFyStartMonth(settings.fyStartMonth);
    setRequireNarration(settings.requireNarration);
    setAllowEditPosted(settings.allowEditPosted);
    setAutoPostDrafts(settings.autoPostDrafts);
    setAccountCodeLength(settings.accountCodeLength);
    setRetainedEarningsAccount(settings.retainedEarningsAccount);

    setEnabledTabs(new Set(settings.enabledTabs || ["basic"]));
    setRequiredTabs(new Set(settings.requiredTabs || []));

    const coreKeys = new Set(ACCOUNTING_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition: any) => !coreKeys.has(tabDefinition.key));
    setFormTabs([
      ...ACCOUNTING_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition: any) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    })));

    const newTabIds = Array.from(new Set([
      ...ACCOUNTING_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key),
      ...(settings.formTabs || []).map((tabDefinition: any) => tabDefinition.key)
    ]));
    const currentFields = settings.fields || {};
    setTabFields(Object.fromEntries(newTabIds.map(tabId => [tabId, currentFields[tabId] || []])));
    setTabFieldEnabled(Object.fromEntries(newTabIds.map(tabId => [tabId, new Set((currentFields[tabId] || []).filter((fieldDefinition: any) => fieldDefinition.enabled).map((fieldDefinition: any) => fieldDefinition.key))])));
    setTabFieldRequired(Object.fromEntries(newTabIds.map(tabId => [tabId, new Set((currentFields[tabId] || []).filter((fieldDefinition: any) => fieldDefinition.required).map((fieldDefinition: any) => fieldDefinition.key))])));
    setTabFieldUnique(Object.fromEntries(newTabIds.map(tabId => [tabId, new Set((currentFields[tabId] || []).filter((fieldDefinition: any) => fieldDefinition.unique).map((fieldDefinition: any) => fieldDefinition.key))])));
    setTabFieldDefaultValues(Object.fromEntries(newTabIds.map(tabId => [
      tabId,
      Object.fromEntries((currentFields[tabId] || []).filter((fieldDefinition: any) => fieldDefinition.defaultValue !== undefined).map((fieldDefinition: any) => [fieldDefinition.key, fieldDefinition.defaultValue]))
    ])));
    setTabFieldPermissions(Object.fromEntries(newTabIds.map(tabId => [
      tabId,
      Object.fromEntries((currentFields[tabId] || []).filter((fieldDefinition: any) => fieldDefinition.permissions).map((fieldDefinition: any) => [fieldDefinition.key, fieldDefinition.permissions as string[]]))
    ])));
    setTabFieldOrder(Object.fromEntries(newTabIds.map(tabId => [tabId, (currentFields[tabId] || []).map((fieldDefinition: any) => fieldDefinition.key)])));
  }, [settings]);

  const handleToggleTabEnabled = (id: string) => { toggleTabEnabled(id); setSaved(false); };
  const handleToggleTabRequired = (id: string) => { toggleTabRequired(id); setSaved(false); };
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => { toggleFieldEnabled(tabId, fieldId); setSaved(false); };
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => { toggleFieldRequired(tabId, fieldId); setSaved(false); };
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => { toggleFieldUnique(tabId, fieldId); setSaved(false); };
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => { handleReorder(tabId, reorderedFields); setSaved(false); };

  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((fieldDefinition) => fieldDefinition.key);
    setTabFieldOrder((prev) => ({
      ...prev,
      [tabId]: syncOrder(prev[tabId] || [], newKeys),
    }));
    setTabFields((prev) => ({ ...prev, [tabId]: newFields as unknown as FieldDefinition[] }));
    setSaved(false);
  };

  const handleEditField = (tabId: string, updatedField: FieldDefinition) => {
    setTabFields(previousTabFields => ({
      ...previousTabFields,
      [tabId]: (previousTabFields[tabId] || []).map(fieldDefinition => fieldDefinition.key === updatedField.key ? updatedField : fieldDefinition)
    }));
    setSaved(false);
  };

  const handleDeleteField = async (tabId: string, fieldId: string) => {
    setTabFields(previousTabFields => ({
      ...previousTabFields,
      [tabId]: (previousTabFields[tabId] || []).filter(fieldDefinition => fieldDefinition.key !== fieldId)
    }));
    setTabFieldOrder(previousFieldOrder => ({
      ...previousFieldOrder,
      [tabId]: (previousFieldOrder[tabId] || []).filter(id => id !== fieldId)
    }));
    setSaved(false);
  };

  const handleAddTab = (label: string) => {
    if (!label.trim()) return;
    const key = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const newTab: TabDefinition = {
      key,
      label: label.trim(),
      description: "Custom user-defined tab",
      enabled: true,
      order: formTabs.length,
      isSystem: false,
    };

    setFormTabs(previousFormTabs => [...previousFormTabs, newTab]);
    setEnabledTabs(previousEnabledTabs => {
      const next = new Set(previousEnabledTabs);
      next.add(key);
      return next;
    });

    setTabFields(previousTabFields => ({ ...previousTabFields, [key]: [] }));
    setTabFieldEnabled(previousEnabledFields => ({ ...previousEnabledFields, [key]: new Set() }));
    setTabFieldRequired(previousRequiredFields => ({ ...previousRequiredFields, [key]: new Set() }));
    setTabFieldUnique(previousUniqueFields => ({ ...previousUniqueFields, [key]: new Set() }));
    setTabFieldDefaultValues(previousDefaultValues => ({ ...previousDefaultValues, [key]: {} }));
    setTabFieldPermissions(previousPermissions => ({ ...previousPermissions, [key]: {} }));
    setTabFieldOrder(previousFieldOrder => ({ ...previousFieldOrder, [key]: [] }));
    setSaved(false);
  };

  const handleDeleteTab = (key: string) => {
    setFormTabs(previousFormTabs => previousFormTabs.filter(tabDefinition => tabDefinition.key !== key));
    setEnabledTabs(previousEnabledTabs => {
      const next = new Set(previousEnabledTabs);
      next.delete(key);
      return next;
    });
    setRequiredTabs(previousRequiredTabs => {
      const next = new Set(previousRequiredTabs);
      next.delete(key);
      return next;
    });
    setSaved(false);
  };

  const handleRenameTab = (key: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setFormTabs(previousFormTabs => previousFormTabs.map(tabDefinition => tabDefinition.key === key ? { ...tabDefinition, label: newLabel.trim() } : tabDefinition));
    setSaved(false);
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
    const newFields: Record<string, FieldDefinition[]> = {};
    formTabs.forEach(tabDefinition => {
      const tabId = tabDefinition.key;
      const combined = (tabFields[tabId] || []).map(fieldDefinition => {
        const fieldKey = fieldDefinition.key || (fieldDefinition as { id?: string }).id || "";
        const enabled      = tabFieldEnabled[tabId]?.has(fieldKey)  ?? fieldDefinition.enabled  ?? false;
        const required     = tabFieldRequired[tabId]?.has(fieldKey) ?? fieldDefinition.required ?? false;
        const unique       = tabFieldUnique[tabId]?.has(fieldKey)   ?? fieldDefinition.unique   ?? false;
        const orderArray   = tabFieldOrder[tabId] || [];
        const orderIndex   = orderArray.indexOf(fieldKey);
        const order        = orderIndex >= 0 ? orderIndex : (fieldDefinition.order ?? 999);
        const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? fieldDefinition.defaultValue;
        const permissions  = tabFieldPermissions[tabId]?.[fieldKey]  ?? fieldDefinition.permissions;

        return {
          ...fieldDefinition,
          key: fieldKey,
          enabled,
          required,
          unique,
          order,
          defaultValue,
          permissions,
        } as FieldDefinition;
      });

      newFields[tabId] = combined.sort((firstField, secondField) => (firstField.order ?? 999) - (secondField.order ?? 999));
    });
    return newFields;
  };

  const handleSave = () => {
    const updatedFormTabs = formTabs.map(tabDefinition => ({
      ...tabDefinition,
      enabled: enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: SettingsType = {
      ...settings,
      organizationName,
      currency,
      currencySymbol,
      dateFormat,
      decimalSeparator,
      decimalPlaces,
      fyStartMonth,
      requireNarration,
      allowEditPosted,
      autoPostDrafts,
      accountCodeLength,
      retainedEarningsAccount,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      formTabs: updatedFormTabs,
      fields: buildFieldsMap(),
    };

    updateSettings(nextSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveFY = (fiscalYear: FiscalYear) => {
    const updatedFiscalYears = fiscalYears.find((existingFiscalYear) => existingFiscalYear.id === fiscalYear.id)
      ? fiscalYears.map((existingFiscalYear) => existingFiscalYear.id === fiscalYear.id ? fiscalYear : existingFiscalYear)
      : [...fiscalYears, fiscalYear];
    onSaveFiscalYears(updatedFiscalYears);
    setFyModal(null);
  };

  const handleDeleteFY = (id: string) => {
    const fiscalYear = fiscalYears.find((existingFiscalYear) => existingFiscalYear.id === id);
    if (fiscalYear?.status === "active") { alert("Cannot delete the active financial year."); return; }
    if (confirm("Delete this financial year?")) onSaveFiscalYears(fiscalYears.filter((existingFiscalYear) => existingFiscalYear.id !== id));
  };

  const activeCurrency = currencies.find((currencyOption: any) => currencyOption.code === currency);
  const formatDate   = (dateValue: string) => dateValue ? new Date(dateValue).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="accounting-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="accounting-settings-title" className="text-[13px] font-bold text-foreground">
          {showFields ? "Field Configuration" : "General Preferences"}
        </h3>
      </div>

      {showPrefs && (
        <div className="space-y-6">
          {/* Organisation */}
          <SectionCard title="Organisation" icon={null}>
            <Field label="Organisation Name" hint="Displayed on reports and printed documents">
              <Input value={organizationName || ""} aria-label="Organisation Name" onChange={(event) => { setOrganizationName(event.target.value); setSaved(false); }} />
            </Field>
          </SectionCard>

          {/* Currency & Display */}
          <SectionCard title="Currency & Display" icon={DollarSign}>
            <Field label="Base Currency" hint="All transactions recorded in this currency">
              <FormSelect
                aria-label="Base Currency"
                value={currency}
                onChange={(currencyValue) => {
                  const selectedCurrency = currencies.find((currencyOption: any) => currencyOption.code === currencyValue);
                  setCurrency(currencyValue);
                  if (selectedCurrency) setCurrencySymbol(selectedCurrency.symbol);
                  setSaved(false);
                }}
                options={currencies.map((currencyOption: any) => ({
                  value: currencyOption.code,
                  label: `${currencyOption.symbol} ${currencyOption.code} – ${currencyOption.name}`
                }))}
              />
              {activeCurrency && (
                <p className="text-xs text-muted-foreground mt-1 m-0">
                  Symbol: <span className="font-bold">{activeCurrency.symbol}</span> · Code: <span className="font-mono font-bold">{activeCurrency.code}</span>
                </p>
              )}
            </Field>
            <Field label="Date Format">
              <FormSelect
                aria-label="Date Format"
                value={dateFormat}
                onChange={(dateFormatValue) => { setDateFormat(dateFormatValue); setSaved(false); }}
                options={DATE_FORMATS}
              />
            </Field>
            <Field label="Number Format">
              <FormSelect
                aria-label="Number Format"
                value={decimalSeparator}
                onChange={(separatorValue) => { setDecimalSeparator(separatorValue as "period" | "comma"); setSaved(false); }}
                options={DECIMAL_SEPARATORS}
              />
            </Field>
            <Field label="Decimal Places">
              <FormSelect
                aria-label="Decimal Places"
                value={String(decimalPlaces)}
                onChange={(decimalPlacesValue) => { setDecimalPlaces(parseInt(decimalPlacesValue)); setSaved(false); }}
                options={[0, 1, 2, 3].map((placeCount) => String(placeCount))}
                className="w-32"
              />
            </Field>
          </SectionCard>

          {/* Financial Years */}
          <SectionCard title="Financial Years" icon={Calendar}>
            <Field label="FY Start Month" hint="Month when each financial year begins">
              <FormSelect
                aria-label="FY Start Month"
                value={fyStartMonth}
                onChange={(startMonthValue) => { setFyStartMonth(startMonthValue); setSaved(false); }}
                options={FY_MONTHS}
                className="w-48"
              />
            </Field>

            <div className="mt-4">
              <header className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">Configured Financial Years</h4>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setFyModal({ label: "", startDate: "", endDate: "", status: "upcoming" })}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-0 h-auto"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Year
                </Button>
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
                    {[...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate)).map((fiscalYear) => {
                      const statusMeta = FY_STATUS[fiscalYear.status] || FY_STATUS.upcoming;
                      const StatusIcon = statusMeta.icon;
                      return (
                        <tr key={fiscalYear.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{fiscalYear.label}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                              <StatusIcon className="w-2.5 h-2.5" aria-hidden="true" /> {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${fiscalYear.label}`}
                                onClick={() => setFyModal({ ...fiscalYear })}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shadow-none"
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${fiscalYear.label}`}
                                onClick={() => handleDeleteFY(fiscalYear.id)}
                                disabled={fiscalYear.status === "active"}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shadow-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
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
              <Toggle ariaLabel="Require Narration" checked={requireNarration} onChange={(checked) => { setRequireNarration(checked); setSaved(false); }} />
            </Field>
            <Field label="Allow Editing Posted Entries" hint="If off, posted entries are locked (recommended)">
              <Toggle ariaLabel="Allow Editing Posted Entries" checked={allowEditPosted} onChange={(checked) => { setAllowEditPosted(checked); setSaved(false); }} />
              {allowEditPosted && (
                <p className="text-xs text-warning mt-1 font-semibold m-0" role="alert">⚠ Enabling this breaks audit integrity. Use reversals instead.</p>
              )}
            </Field>
            <Field label="Auto-post Draft Entries" hint="Automatically post entries saved as draft">
              <Toggle ariaLabel="Auto-post Draft Entries" checked={autoPostDrafts} onChange={(checked) => { setAutoPostDrafts(checked); setSaved(false); }} />
            </Field>
          </SectionCard>

          {/* Account Numbering */}
          <SectionCard title="Account Numbering" icon={null}>
            <Field label="Default Code Length" hint="Number of digits for new account codes">
              <FormSelect
                aria-label="Default Code Length"
                value={String(accountCodeLength)}
                onChange={(codeLengthValue) => { setAccountCodeLength(parseInt(codeLengthValue)); setSaved(false); }}
                options={[3, 4, 5, 6].map((digitCount) => String(digitCount))}
                className="w-32"
              />
            </Field>
            <Field label="Retained Earnings Account" hint="Used for closing net surplus at year-end">
              <FormSelect
                aria-label="Retained Earnings Account"
                value={retainedEarningsAccount || ""}
                onChange={(accountId) => { setRetainedEarningsAccount(accountId); setSaved(false); }}
                placeholder="— None —"
                options={accounts
                  .filter((account) => account.type === "Equity" && account.isActive !== false)
                  .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
                  .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
              />
            </Field>
          </SectionCard>
        </div>
      )}

      {showFields && (
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info text-left">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs">Dynamic Fields Manager</h4>
              <p className="text-[11px] mt-0.5 text-info/90">
                Configure visible sections, reorder fields, and manage custom metadata definitions.
              </p>
            </div>
          </div>

          {formTabs.map((tabDefinition) => {
            const tabId = tabDefinition.key;
            const tabLabel = tabDefinition.label.charAt(0).toUpperCase() + tabDefinition.label.slice(1);
            const tabDescription = tabDefinition.description;
            const tabDefs = tabFields[tabId] || [];
            const enabledSet = tabFieldEnabled[tabId] || new Set();
            const requiredSet = tabFieldRequired[tabId] || new Set();
            const isOn = tabId === "basic" ? true : enabledTabs.has(tabId);
            const isReq = requiredTabs.has(tabId);

            return (
              <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden text-left">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isOn}
                      onCheckedChange={tabId !== "basic" ? () => handleToggleTabEnabled(tabId) : undefined}
                      aria-label={`Enable Tab ${tabLabel}`}
                      disabled={tabId === "basic"}
                    />
                  </div>
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                      {!tabDefinition.isSystem && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setRenamingTabKey(tabId);
                              setRenameTabLabel(tabDefinition.label);
                            }}
                            className="p-1 h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none flex items-center justify-center"
                            title="Rename Tab"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeleteTab(tabId)}
                            className="p-1 h-6 w-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none flex items-center justify-center"
                            title="Delete Tab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tabDescription}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    {tabDefs.filter((fieldDefinition) => enabledSet.has(fieldDefinition.key)).length}/{tabDefs.length}
                  </span>
                  {tabId !== "basic" && isOn && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleToggleTabRequired(tabId)}
                      className={`flex-shrink-0 px-2.5 py-1 h-auto text-[10px] font-bold border transition-all shadow-none ml-2
                        ${
                          isReq
                            ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {isReq ? "Required" : "Optional"}
                    </Button>
                  )}
                </div>

                {isOn && (
                  <div className="p-3 space-y-3">
                    <CoreFieldEditorList
                      tabId={tabId}
                      fields={getOrderedFields(tabDefs, tabFieldOrder[tabId])}
                      enabledSet={enabledSet}
                      requiredSet={requiredSet}
                      onToggleEnabled={(fieldId: string) => handleToggleFieldEnabled(tabId, fieldId)}
                      onToggleRequired={(fieldId: string) => handleToggleFieldRequired(tabId, fieldId)}
                      onToggleUnique={(fieldId: string) => handleToggleFieldUnique(tabId, fieldId)}
                      onReorder={(reordered: FieldDefinition[]) => handleReorderFields(tabId, reordered)}
                      isUniqueField={(targetTabId: string, fieldId: string) => tabFieldUnique[targetTabId]?.has(fieldId) || false}
                      isCoreField={(key: string) => INITIAL_ACCOUNTING_FIELD_SEED[tabId]?.some((fieldDefinition: any) => fieldDefinition.key === key) ?? false}
                      defaultValues={tabFieldDefaultValues[tabId]}
                      permissions={tabFieldPermissions[tabId]}
                      onChangeDefaults={(fieldId: string, fieldValue: unknown) => {
                        setTabFieldDefaultValues(previousDefaultValues => ({ ...previousDefaultValues, [tabId]: { ...previousDefaultValues[tabId], [fieldId]: fieldValue } }));
                        setSaved(false);
                      }}
                      onChangePermissions={(fieldId: string, roles: string[]) => {
                        setTabFieldPermissions(previousPermissions => ({ ...previousPermissions, [tabId]: { ...previousPermissions[tabId], [fieldId]: roles } }));
                        setSaved(false);
                      }}
                      onEditField={(fieldDefinition: FieldDefinition) => handleEditField(tabId, fieldDefinition)}
                      onDeleteField={(fieldId: string) => handleDeleteField(tabId, fieldId)}
                      labels={{
                        required: "Required",
                        optional: "Optional",
                        unique: "Unique",
                        standard: "Standard",
                      }}
                    />
                    <div className="border-t border-border pt-3">
                      <CustomFieldsBuilder
                        fields={(tabFields[tabId] || []).map(fieldDefinition => ({...fieldDefinition, id: fieldDefinition.key})) as unknown as CustomFieldConfig[]}
                        droppableId={`custom-fields-${tabId}`}
                        onChange={(fieldDefinitions) => handleCustomFieldsChange(tabId, fieldDefinitions)}
                      />
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setIsAddTabModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Tab</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add Tab Modal */}
      <Modal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        title="Add Custom Tab"
        icon={Plus}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddTab(newTabLabel);
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
              }}
              disabled={!newTabLabel.trim()}
              type="button"
            >
              Add Tab
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="newTabLabel" className="text-xs font-semibold text-foreground">Tab Name *</label>
          <Input
            id="newTabLabel"
            value={newTabLabel}
            onChange={(event) => setNewTabLabel(event.target.value)}
            placeholder="e.g. Extra Info"
            autoFocus
          />
        </div>
      </Modal>

      {/* Rename Tab Modal */}
      <Modal
        open={renamingTabKey !== null}
        onClose={() => {
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        title="Rename Custom Tab"
        icon={Pencil}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setRenamingTabKey(null);
                setRenameTabLabel("");
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renamingTabKey) {
                  handleRenameTab(renamingTabKey, renameTabLabel);
                }
                setRenamingTabKey(null);
                setRenameTabLabel("");
              }}
              disabled={!renameTabLabel.trim()}
              type="button"
            >
              Rename Tab
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="renameTabLabel" className="text-xs font-semibold text-foreground">Tab Name *</label>
          <Input
            id="renameTabLabel"
            value={renameTabLabel}
            onChange={(event) => setRenameTabLabel(event.target.value)}
            placeholder="e.g. Custom Fields"
            autoFocus
          />
        </div>
      </Modal>

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Saved!</> : <><Save className="w-3.5 h-3.5" aria-hidden="true" /> Save Settings</>}
        </Button>
      </footer>

      <FYModal open={!!fyModal} initial={fyModal} onSave={handleSaveFY} onClose={() => setFyModal(null)} />
    </section>
  );
}
