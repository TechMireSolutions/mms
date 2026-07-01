import React, { useState, useEffect } from "react";
import {
  DollarSign, Calendar, Plus, Pencil, Trash2,
  CheckCircle2, Lock, Clock, Save, BookOpen
} from "lucide-react";
import { Account, AccountingSettings as SettingsType, FiscalYear } from '@/lib/data/accountingData';
import {
  DEFAULT_CURRENCIES,
  ACCOUNTING_TAB_REGISTRY,
  INITIAL_ACCOUNTING_FIELD_SEED,
} from "@mms/shared";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useAccountingConfig } from "@/hooks/useAccountingConfig";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { DatePicker } from "../ui/DatePicker";
import { FormModal } from "../ui/FormModal";
import { FORM_LABEL } from "../ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormSelect } from "../ui/FormSelect";
import { Switch } from "../ui/switch";
import { ModuleFieldsSetup } from "../ui/ModuleFieldsSetup";

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

export function AccountingSettings({ accounts, fiscalYears, onSaveFiscalYears, mode }: AccountingSettingsProps) {
  const currencies = useLiveCollection<(typeof DEFAULT_CURRENCIES)[number]>("currencies", DEFAULT_CURRENCIES);
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

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: ACCOUNTING_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

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

    const coreKeys = new Set(ACCOUNTING_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...ACCOUNTING_TAB_REGISTRY,
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

  const handleSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map(tabDefinition => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
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
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
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

  const handleDeleteFY = (fiscalYearId: string) => {
    const fiscalYear = fiscalYears.find((existingFiscalYear) => existingFiscalYear.id === fiscalYearId);
    if (fiscalYear?.status === "active") { alert("Cannot delete the active financial year."); return; }
    if (confirm("Delete this financial year?")) onSaveFiscalYears(fiscalYears.filter((existingFiscalYear) => existingFiscalYear.id !== fiscalYearId));
  };

  const activeCurrency = currencies.find((currencyOption) => currencyOption.code === currency);
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
                  const selectedCurrency = currencies.find((currencyOption) => currencyOption.code === currencyValue);
                  setCurrency(currencyValue);
                  if (selectedCurrency) setCurrencySymbol(selectedCurrency.symbol);
                  setSaved(false);
                }}
                options={currencies.map((currencyOption) => ({
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
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_ACCOUNTING_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

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
