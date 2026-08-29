import React from "react";
import {
  DEFAULT_CURRENCIES,
  type AppTranslationKey,
  type FinanceSettings,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useTranslation } from "@/hooks/useTranslation";

const ALL_PAYMENT_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"] as const;

export interface FinancePreferencesSectionProps {
  settings: FinanceSettings;
  settingsDraft: FinanceSettings;
  upd: <K extends keyof FinanceSettings>(field: K, value: FinanceSettings[K]) => void;
}

export function FinancePreferencesSection({
  settings,
  settingsDraft,
  upd,
}: FinancePreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  const toggleMethod = (method: string) => {
    const paymentMethods = settingsDraft.paymentMethods || [];
    const nextMethods = paymentMethods.includes(method)
      ? paymentMethods.filter((selectedMethod) => selectedMethod !== method)
      : [...paymentMethods, method];
    upd("paymentMethods", nextMethods);
  };

  return (
    <div className="space-y-4 text-start">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="finance-currency" className={FORM_LABEL}>
            {t("finance.settings.currency")}
          </label>
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
          <label htmlFor="inv-prefix" className={FORM_LABEL}>
            {t("finance.settings.invoicePrefix")}
          </label>
          <Input
            id="inv-prefix"
            className={FORM_INPUT}
            value={settingsDraft.invoicePrefix || ""}
            onChange={(event) => upd("invoicePrefix", event.target.value)}
            placeholder={settings.invoicePrefix}
          />
        </div>
        <div>
          <label htmlFor="due-days" className={FORM_LABEL}>
            {t("finance.settings.dueDays")}
          </label>
          <Input
            id="due-days"
            type="number"
            className={FORM_INPUT}
            value={settingsDraft.dueDays || ""}
            onChange={(event) => upd("dueDays", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="late-fee" className={FORM_LABEL}>
            {t("finance.settings.lateFee")}
          </label>
          <Input
            id="late-fee"
            type="number"
            className={FORM_INPUT}
            value={settingsDraft.lateFeePercent || ""}
            onChange={(event) => upd("lateFeePercent", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tax-rate" className={FORM_LABEL}>
            {t("finance.settings.taxRate")}
          </label>
          <Input
            id="tax-rate"
            type="number"
            className={FORM_INPUT}
            value={settingsDraft.taxRate || ""}
            onChange={(event) => upd("taxRate", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="reminder-days" className={FORM_LABEL}>
            {t("finance.settings.reminderDays")}
          </label>
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
        <span className={FORM_LABEL}>{t("finance.settings.paymentMethods")}</span>
        <div
          className="flex flex-wrap gap-2 mt-1"
          role="group"
          aria-label={t("finance.settings.paymentMethods")}
        >
          {ALL_PAYMENT_METHODS.map((method) => {
            const active = (settingsDraft.paymentMethods || []).includes(method);
            return (
              <Button
                key={method}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMethod(method)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  active
                    ? "bg-primary/10 border-primary/30 text-primary font-bold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(`finance.paymentMethod.${method}` as AppTranslationKey)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 pt-1" role="group" aria-label={t("finance.settings.flags")}>
        <ToggleRow
          label={t("finance.settings.autoGenerate")}
          description={t("finance.settings.autoGenerateDescription")}
          value={settingsDraft.autoGenerateInvoice}
          onChange={(value) => upd("autoGenerateInvoice", value)}
        />
        <ToggleRow
          label={t("finance.settings.sendEmail")}
          description={t("finance.settings.sendEmailDescription")}
          value={settingsDraft.sendInvoiceEmail}
          onChange={(value) => upd("sendInvoiceEmail", value)}
        />
        <ToggleRow
          label={t("finance.settings.partialPayment")}
          description={t("finance.settings.partialPaymentDescription")}
          value={settingsDraft.allowPartialPayment}
          onChange={(value) => upd("allowPartialPayment", value)}
        />
        <ToggleRow
          label={t("finance.settings.discountApproval")}
          description={t("finance.settings.discountApprovalDescription")}
          value={settingsDraft.requireApproval}
          onChange={(value) => upd("requireApproval", value)}
        />
        <ToggleRow
          label={t("finance.settings.overdueReminders")}
          description={t("finance.settings.overdueRemindersDescription")}
          value={settingsDraft.overdueReminder}
          onChange={(value) => upd("overdueReminder", value)}
        />
        <ToggleRow
          label={t("finance.settings.feeReminders")}
          description={t("finance.settings.feeRemindersDescription")}
          value={settingsDraft.feeReminders}
          onChange={(value) => upd("feeReminders", value)}
        />
      </div>
    </div>
  );
}
