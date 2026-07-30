import type React from "react";
import {
  type AccountingSettings,
  type AppTranslationKey,
  formatDate,
} from "@mms/shared";
import { Calendar, DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear } from "@/lib/data/accountingData";
import { AccountingSettingsField } from "./AccountingSettingsField";
import { AccountingSettingsSectionCard } from "./AccountingSettingsSectionCard";

type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

interface AccountingSettingsPreferencesProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
  currencies: CurrencyOption[];
  activeCurrency: CurrencyOption | undefined;
  decimalSeparators: { label: string; value: string }[];
  fyStatusConfig: Record<string, StatusBadgeConfigItem>;
  canEditSetup: boolean;
  onEditFiscalYear: (fiscalYear: Partial<FiscalYear>) => void;
  onDeleteFiscalYear: (fiscalYearId: string) => void;
}

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"];
const FY_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function AccountingSettingsPreferences({
  accounts,
  fiscalYears,
  settingsDraft,
  upd,
  currencies,
  activeCurrency,
  decimalSeparators,
  fyStatusConfig,
  canEditSetup,
  onEditFiscalYear,
  onDeleteFiscalYear,
}: AccountingSettingsPreferencesProps): React.JSX.Element {
  const { t } = useTranslation();
  const localizedMonths = FY_MONTHS.map((monthName) => ({
    value: monthName,
    label: t(`accounting.settings.months.${monthName.toLowerCase()}` as AppTranslationKey) || monthName
  }));

  return (
    <div className="space-y-6">
      <AccountingSettingsSectionCard title={t("accounting.settings.secOrganisation")} icon={null}>
        <AccountingSettingsField label={t("accounting.settings.fields.organisationName")} hint={t("accounting.settings.fields.organisationNameHint")}>
          <Input value={settingsDraft.organizationName || ""} aria-label={t("accounting.settings.fields.organisationName")} onChange={(event) => upd("organizationName", event.target.value)} />
        </AccountingSettingsField>
      </AccountingSettingsSectionCard>

      <AccountingSettingsSectionCard title={t("accounting.settings.secCurrency")} icon={DollarSign}>
        <AccountingSettingsField label={t("accounting.settings.fields.baseCurrency")} hint={t("accounting.settings.fields.baseCurrencyHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.baseCurrency")}
            value={settingsDraft.currency}
            onChange={(currencyValue) => {
              const selectedCurrency = currencies.find((currencyOption) => currencyOption.code === currencyValue);
              upd("currency", currencyValue);
              if (selectedCurrency) upd("currencySymbol", selectedCurrency.symbol);
            }}
            options={currencies.map((currencyOption) => ({
              value: currencyOption.code,
              label: `${currencyOption.symbol} ${currencyOption.code} – ${currencyOption.name}`
            }))}
          />
          {activeCurrency && (
            <p className="text-xs text-muted-foreground mt-1 m-0">
              {t("accounting.settings.fields.symbol")}: <span className="font-bold">{activeCurrency.symbol}</span> · {t("accounting.settings.fields.code")}: <span className="font-mono font-bold">{activeCurrency.code}</span>
            </p>
          )}
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.dateFormat")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.dateFormat")}
            value={settingsDraft.dateFormat}
            onChange={(dateFormatValue) => upd("dateFormat", dateFormatValue)}
            options={DATE_FORMATS}
          />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.numberFormat")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.numberFormat")}
            value={settingsDraft.decimalSeparator}
            onChange={(separatorValue) => upd("decimalSeparator", separatorValue as AccountingSettings["decimalSeparator"])}
            options={decimalSeparators}
          />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.decimalPlaces")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.decimalPlaces")}
            value={String(settingsDraft.decimalPlaces ?? 2)}
            onChange={(decimalPlacesValue) => upd("decimalPlaces", parseInt(decimalPlacesValue))}
            options={[0, 1, 2, 3].map((placeCount) => String(placeCount))}
            className="w-32"
          />
        </AccountingSettingsField>
      </AccountingSettingsSectionCard>

      <AccountingSettingsSectionCard title={t("accounting.settings.secFiscalYears")} icon={Calendar}>
        <AccountingSettingsField label={t("accounting.settings.fields.fyStartMonth")} hint={t("accounting.settings.fields.fyStartMonthHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.fyStartMonth")}
            value={settingsDraft.fyStartMonth}
            onChange={(startMonthValue) => upd("fyStartMonth", startMonthValue)}
            options={localizedMonths}
            className="w-full min-w-0 sm:w-48"
          />
        </AccountingSettingsField>

        <div className="mt-4">
          <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="min-w-0 text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.settings.configuredFiscalYears")}</h4>
            {canEditSetup && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => onEditFiscalYear({ label: "", startDate: "", endDate: "", status: "upcoming" })}
                className="flex shrink-0 items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.addYear")}
              </Button>
            )}
          </header>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="space-y-3 p-3 md:hidden">
              {[...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate)).map((fiscalYear) => (
                <article key={fiscalYear.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground m-0">{fiscalYear.label}</h4>
                      <p className="text-xs text-muted-foreground m-0 mt-0.5">
                        {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                  </div>
                  {canEditSetup && (
                    <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("fields.editNamedAria", { name: fiscalYear.label })}
                        onClick={() => onEditFiscalYear({ ...fiscalYear })}
                        className="text-muted-foreground hover:text-foreground shadow-none"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      {fiscalYear.status !== "active" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("fields.deleteNamedAria", { name: fiscalYear.label })}
                          onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                          className="text-muted-foreground hover:text-destructive shadow-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto max-w-full md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("accounting.settings.fy.tableCaption")}</caption>
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.label")}</th>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.period")}</th>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.status")}</th>
                  <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate)).map((fiscalYear) => {
                  return (
                    <tr key={fiscalYear.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{fiscalYear.label}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                      </td>
                      <td className="px-4 py-2.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {canEditSetup && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("fields.editNamedAria", { name: fiscalYear.label })}
                              onClick={() => onEditFiscalYear({ ...fiscalYear })}
                              className="text-muted-foreground hover:text-foreground shadow-none"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          )}
                          {canEditSetup && fiscalYear.status !== "active" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("fields.deleteNamedAria", { name: fiscalYear.label })}
                              onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                              className="text-muted-foreground hover:text-destructive shadow-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </AccountingSettingsSectionCard>

      <AccountingSettingsSectionCard title={t("accounting.settings.secRules")} icon={null}>
        <AccountingSettingsField label={t("accounting.settings.fields.requireNarration")} hint={t("accounting.settings.fields.requireNarrationHint")}>
          <Switch aria-label={t("accounting.settings.fields.requireNarration")} checked={settingsDraft.requireNarration} onCheckedChange={(checked) => upd("requireNarration", checked)} />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.allowEditPosted")} hint={t("accounting.settings.fields.allowEditPostedHint")}>
          <Switch aria-label={t("accounting.settings.fields.allowEditPosted")} checked={settingsDraft.allowEditPosted} onCheckedChange={(checked) => upd("allowEditPosted", checked)} />
          {settingsDraft.allowEditPosted && (
            <p className="text-xs text-warning mt-1 font-semibold m-0" role="alert">{t("accounting.settings.fields.allowEditPostedWarning")}</p>
          )}
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.autoPostDrafts")} hint={t("accounting.settings.fields.autoPostDraftsHint")}>
          <Switch aria-label={t("accounting.settings.fields.autoPostDrafts")} checked={settingsDraft.autoPostDrafts} onCheckedChange={(checked) => upd("autoPostDrafts", checked)} />
        </AccountingSettingsField>
      </AccountingSettingsSectionCard>

      <AccountingSettingsSectionCard title={t("accounting.settings.secNumbering")} icon={null}>
        <AccountingSettingsField label={t("accounting.settings.fields.defaultCodeLength")} hint={t("accounting.settings.fields.defaultCodeLengthHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.defaultCodeLength")}
            value={String(settingsDraft.accountCodeLength ?? 4)}
            onChange={(codeLengthValue) => upd("accountCodeLength", parseInt(codeLengthValue))}
            options={[3, 4, 5, 6].map((digitCount) => String(digitCount))}
            className="w-32"
          />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.retainedEarningsAccount")} hint={t("accounting.settings.fields.retainedEarningsAccountHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.retainedEarningsAccount")}
            value={settingsDraft.retainedEarningsAccount || ""}
            onChange={(accountId) => upd("retainedEarningsAccount", accountId)}
            placeholder={t("accounting.journal.form.none")}
            options={accounts
              .filter((account) => account.type === "Equity" && account.isActive !== false)
              .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
              .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
          />
        </AccountingSettingsField>
      </AccountingSettingsSectionCard>
    </div>
  );
}
