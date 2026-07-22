import React from "react";
import { Card } from "@/components/ui/card";
import { Save, DollarSign } from "lucide-react";
import { useFinanceConfig } from "@/hooks/useStandardModuleConfig";
import {
  FINANCE_TAB_REGISTRY,
  INITIAL_FINANCE_FIELD_SEED,
  DEFAULT_CURRENCIES,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";

interface FinanceSettingsProps {
  mode?: "fields" | "preferences";
}

export function FinanceSettings({ mode }: FinanceSettingsProps): React.ReactElement {
  const config = useFinanceConfig();
  const {
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: FINANCE_TAB_REGISTRY,
  });

  const handleSave = () => {
    saveSettings();
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  const ALL_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"];
  const toggleMethod = (method: string) => {
    const paymentMethods = settingsDraft.paymentMethods || [];
    const nextMethods = paymentMethods.includes(method)
      ? paymentMethods.filter((selectedMethod) => selectedMethod !== method)
      : [...paymentMethods, method];
    upd("paymentMethods", nextMethods);
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
                value={settingsDraft.currency}
                onChange={(value) => upd("currency", value)}
                options={DEFAULT_CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.code} — ${c.name}`,
                }))}
              />
            </div>
            <div>
              <label htmlFor="inv-prefix" className={FORM_LABEL}>Invoice Prefix</label>
              <Input
                id="inv-prefix"
                className={FORM_INPUT}
                value={settingsDraft.invoicePrefix || ""}
                onChange={(event) => upd("invoicePrefix", event.target.value)}
                placeholder="INV"
              />
            </div>
            <div>
              <label htmlFor="due-days" className={FORM_LABEL}>Default Due Days</label>
              <Input
                id="due-days"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.dueDays || ""}
                onChange={(event) => upd("dueDays", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="late-fee" className={FORM_LABEL}>Late Fee (%)</label>
              <Input
                id="late-fee"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.lateFeePercent || ""}
                onChange={(event) => upd("lateFeePercent", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tax-rate" className={FORM_LABEL}>Tax Rate (%)</label>
              <Input
                id="tax-rate"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.taxRate || ""}
                onChange={(event) => upd("taxRate", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="reminder-days" className={FORM_LABEL}>Reminder Days Before Due</label>
              <Input
                id="reminder-days"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.reminderDaysBefore || ""}
                onChange={(event) => upd("reminderDaysBefore", event.target.value)}
              />
            </div>
          </div>

          <div>
            <span className={FORM_LABEL}>Accepted Payment Methods</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select payment methods">
              {ALL_METHODS.map((method) => {
                const active = (settingsDraft.paymentMethods || []).includes(method);
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
            <ToggleRow label="Auto-generate Invoices" description="Automatically create invoices on enrollment" value={settingsDraft.autoGenerateInvoice} onChange={(value) => upd("autoGenerateInvoice", value)} />
            <ToggleRow label="Send Invoice by Email" description="Email invoice to guardian on creation" value={settingsDraft.sendInvoiceEmail} onChange={(value) => upd("sendInvoiceEmail", value)} />
            <ToggleRow label="Allow Partial Payment" description="Accept payments less than the full amount" value={settingsDraft.allowPartialPayment} onChange={(value) => upd("allowPartialPayment", value)} />
            <ToggleRow label="Require Approval for Discounts" description="Discounts need admin approval before applying" value={settingsDraft.requireApproval} onChange={(value) => upd("requireApproval", value)} />
            <ToggleRow label="Overdue Reminders" description="Send reminders for overdue invoices" value={settingsDraft.overdueReminder} onChange={(value) => upd("overdueReminder", value)} />
            <ToggleRow label="Fee Reminders" description="Send notifications when fees are due or overdue" value={settingsDraft.feeReminders} onChange={(value) => upd("feeReminders", value)} />
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
