import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Save, DollarSign } from "lucide-react";
import { useFinanceConfig } from "@/tenant/features/finance/hooks/useFinanceConfig";
import {
  type FinanceSettings as FinanceSettingsData,
  FINANCE_TAB_REGISTRY,
  INITIAL_FINANCE_FIELD_SEED,
} from "@mms/shared";
import { useModuleFieldsEditor } from "@/tenant/hooks/useModuleFieldsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`${label}: ${description || ""}`}
      />
    </div>
  );
}

interface FinanceSettingsProps {
  mode?: "fields" | "preferences";
}

export function FinanceSettings({ mode }: FinanceSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useFinanceConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [currency, setCurrency] = useState(settings.currency);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [dueDays, setDueDays] = useState(settings.dueDays);
  const [lateFeePercent, setLateFeePercent] = useState(settings.lateFeePercent);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods);
  const [autoGenerateInvoice, setAutoGenerateInvoice] = useState(settings.autoGenerateInvoice);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(settings.sendInvoiceEmail);
  const [allowPartialPayment, setAllowPartialPayment] = useState(settings.allowPartialPayment);
  const [requireApproval, setRequireApproval] = useState(settings.requireApproval);
  const [overdueReminder, setOverdueReminder] = useState(settings.overdueReminder);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(settings.reminderDaysBefore);
  const [feeReminders, setFeeReminders] = useState(settings.feeReminders);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: FINANCE_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    setCurrency(settings.currency);
    setInvoicePrefix(settings.invoicePrefix);
    setDueDays(settings.dueDays);
    setLateFeePercent(settings.lateFeePercent);
    setTaxRate(settings.taxRate);
    setPaymentMethods(settings.paymentMethods);
    setAutoGenerateInvoice(settings.autoGenerateInvoice);
    setSendInvoiceEmail(settings.sendInvoiceEmail);
    setAllowPartialPayment(settings.allowPartialPayment);
    setRequireApproval(settings.requireApproval);
    setOverdueReminder(settings.overdueReminder);
    setReminderDaysBefore(settings.reminderDaysBefore);
    setFeeReminders(settings.feeReminders);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreTabKeys = new Set(FINANCE_TAB_REGISTRY.map((t) => t.key));
    const customTabs = (settings.formTabs || []).filter((t) => !coreTabKeys.has(t.key));
    const updatedTabs = [
      ...FINANCE_TAB_REGISTRY,
      ...customTabs
    ].map((t) => ({
      ...t,
      enabled: t.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(t.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings]);

  const handleSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: FinanceSettingsData = {
      ...settings,
      currency,
      invoicePrefix,
      dueDays,
      lateFeePercent,
      taxRate,
      paymentMethods,
      autoGenerateInvoice,
      sendInvoiceEmail,
      allowPartialPayment,
      requireApproval,
      overdueReminder,
      reminderDaysBefore,
      feeReminders,
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

  const ALL_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"];
  const toggleMethod = (method: string) => {
    const nextMethods = paymentMethods.includes(method)
      ? paymentMethods.filter((selectedMethod) => selectedMethod !== method)
      : [...paymentMethods, method];
    setPaymentMethods(nextMethods);
    setSaved(false);
  };

  return (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80" aria-labelledby="finance-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 pl-1">
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
              <FormSelect
                id="finance-currency"
                value={currency}
                onChange={(value) => { setCurrency(value); setSaved(false); }}
                options={[
                  { value: "PKR", label: "PKR — Pakistani Rupee" },
                  { value: "USD", label: "USD — US Dollar" },
                  { value: "GBP", label: "GBP — British Pound" },
                  { value: "SAR", label: "SAR — Saudi Riyal" },
                  { value: "AED", label: "AED — UAE Dirham" },
                  { value: "EUR", label: "EUR — Euro" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="inv-prefix" className={FORM_LABEL}>Invoice Prefix</label>
              <Input
                id="inv-prefix"
                className={FORM_INPUT}
                value={invoicePrefix}
                onChange={(event) => { setInvoicePrefix(event.target.value); setSaved(false); }}
                placeholder="INV"
              />
            </div>
            <div>
              <label htmlFor="due-days" className={FORM_LABEL}>Default Due Days</label>
              <Input
                id="due-days"
                type="number"
                className={FORM_INPUT}
                value={dueDays}
                onChange={(event) => { setDueDays(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="late-fee" className={FORM_LABEL}>Late Fee (%)</label>
              <Input
                id="late-fee"
                type="number"
                className={FORM_INPUT}
                value={lateFeePercent}
                onChange={(event) => { setLateFeePercent(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="tax-rate" className={FORM_LABEL}>Tax Rate (%)</label>
              <Input
                id="tax-rate"
                type="number"
                className={FORM_INPUT}
                value={taxRate}
                onChange={(event) => { setTaxRate(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="reminder-days" className={FORM_LABEL}>Reminder Days Before Due</label>
              <Input
                id="reminder-days"
                type="number"
                className={FORM_INPUT}
                value={reminderDaysBefore}
                onChange={(event) => { setReminderDaysBefore(event.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div>
            <span className={FORM_LABEL}>Accepted Payment Methods</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select payment methods">
              {ALL_METHODS.map((method) => {
                const active = paymentMethods.includes(method);
                return (
                  <Button
                    key={method}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMethod(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      active ? "bg-primary/10 border-primary/30 text-primary font-bold" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {method.replace("_", " ")}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Financial registry feature flags toggles">
            <Toggle label="Auto-generate Invoices" description="Automatically create invoices on enrollment" value={autoGenerateInvoice} onChange={(value) => { setAutoGenerateInvoice(value); setSaved(false); }} />
            <Toggle label="Send Invoice by Email" description="Email invoice to guardian on creation" value={sendInvoiceEmail} onChange={(value) => { setSendInvoiceEmail(value); setSaved(false); }} />
            <Toggle label="Allow Partial Payment" description="Accept payments less than the full amount" value={allowPartialPayment} onChange={(value) => { setAllowPartialPayment(value); setSaved(false); }} />
            <Toggle label="Require Approval for Discounts" description="Discounts need admin approval before applying" value={requireApproval} onChange={(value) => { setRequireApproval(value); setSaved(false); }} />
            <Toggle label="Overdue Reminders" description="Send reminders for overdue invoices" value={overdueReminder} onChange={(value) => { setOverdueReminder(value); setSaved(false); }} />
            <Toggle label="Fee Reminders" description="Send notifications when fees are due or overdue" value={feeReminders} onChange={(value) => { setFeeReminders(value); setSaved(false); }} />
          </div>
        </>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_FINANCE_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}



      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </Card>
  );
}
