import { type FinanceSettings } from "@mms/shared";
import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Save, DollarSign } from "lucide-react";
import { useFinanceConfig } from "@/hooks/useStandardModuleConfig";
import {
  FINANCE_TAB_REGISTRY,
  INITIAL_FINANCE_FIELD_SEED,
  DEFAULT_CURRENCIES,
  FINANCE_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "finance.setup.fields",
  preferences: "finance.setup.preferences",
};

export function FinanceSettings(): React.ReactElement {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(FINANCE_MODULE_MANIFEST);
  const config = useFinanceConfig();
  const {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor<FinanceSettings>({
    config,
    tabRegistry: FINANCE_TAB_REGISTRY,
  });

  const handleSave = async (): Promise<void> => {
    try {
      await saveSettingsAsync();
      notify.success(t("finance.settings.saved"));
    } catch (error: unknown) {
      notify.error(t("finance.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const settingsSubTabs = useMemo(() => FINANCE_MODULE_MANIFEST.setupSubTabs.map((key) => ({
    key,
    label: t(SETUP_TAB_LABEL_KEYS[key]),
  })), [t]);
  const [sub, setSub] = useState<string>("fields");
  const showPrefs = sub === "preferences";
  const showFields = sub === "fields";

  const ALL_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"];
  const toggleMethod = (method: string) => {
    const paymentMethods = settingsDraft.paymentMethods || [];
    const nextMethods = paymentMethods.includes(method)
      ? paymentMethods.filter((selectedMethod) => selectedMethod !== method)
      : [...paymentMethods, method];
    upd("paymentMethods", nextMethods);
  };

  return (
    <div className="space-y-4">
      <SubTabBar tabs={settingsSubTabs} value={sub} onChange={setSub} />
      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("finance.setup.readOnly")}
        </p>
      ) : (
    <Card accentColor="primary" className="p-5 space-y-4 shadow-sm hover:shadow-md border-border/80" aria-labelledby="finance-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/40 ps-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="finance-settings-title" className="text-sm font-bold text-foreground">{t("finance.settings.title")}</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="finance-currency" className={FORM_LABEL}>{t("finance.settings.currency")}</label>
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
              <label htmlFor="inv-prefix" className={FORM_LABEL}>{t("finance.settings.invoicePrefix")}</label>
              <Input
                id="inv-prefix"
                className={FORM_INPUT}
                value={settingsDraft.invoicePrefix || ""}
                onChange={(event) => upd("invoicePrefix", event.target.value)}
                placeholder={settings.invoicePrefix}
              />
            </div>
            <div>
              <label htmlFor="due-days" className={FORM_LABEL}>{t("finance.settings.dueDays")}</label>
              <Input
                id="due-days"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.dueDays || ""}
                onChange={(event) => upd("dueDays", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="late-fee" className={FORM_LABEL}>{t("finance.settings.lateFee")}</label>
              <Input
                id="late-fee"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.lateFeePercent || ""}
                onChange={(event) => upd("lateFeePercent", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tax-rate" className={FORM_LABEL}>{t("finance.settings.taxRate")}</label>
              <Input
                id="tax-rate"
                type="number"
                className={FORM_INPUT}
                value={settingsDraft.taxRate || ""}
                onChange={(event) => upd("taxRate", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="reminder-days" className={FORM_LABEL}>{t("finance.settings.reminderDays")}</label>
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
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("finance.settings.paymentMethods")}>
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
                    {t(`finance.paymentMethod.${method}` as AppTranslationKey)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label={t("finance.settings.flags")}>
            <ToggleRow label={t("finance.settings.autoGenerate")} description={t("finance.settings.autoGenerateDescription")} value={settingsDraft.autoGenerateInvoice} onChange={(value) => upd("autoGenerateInvoice", value)} />
            <ToggleRow label={t("finance.settings.sendEmail")} description={t("finance.settings.sendEmailDescription")} value={settingsDraft.sendInvoiceEmail} onChange={(value) => upd("sendInvoiceEmail", value)} />
            <ToggleRow label={t("finance.settings.partialPayment")} description={t("finance.settings.partialPaymentDescription")} value={settingsDraft.allowPartialPayment} onChange={(value) => upd("allowPartialPayment", value)} />
            <ToggleRow label={t("finance.settings.discountApproval")} description={t("finance.settings.discountApprovalDescription")} value={settingsDraft.requireApproval} onChange={(value) => upd("requireApproval", value)} />
            <ToggleRow label={t("finance.settings.overdueReminders")} description={t("finance.settings.overdueRemindersDescription")} value={settingsDraft.overdueReminder} onChange={(value) => upd("overdueReminder", value)} />
            <ToggleRow label={t("finance.settings.feeReminders")} description={t("finance.settings.feeRemindersDescription")} value={settingsDraft.feeReminders} onChange={(value) => upd("feeReminders", value)} />
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
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? t("settings.savedBadge") : t("common.save")}
        </Button>
      </footer>
    </Card>
      )}
    </div>
  );
}
