import type React from "react";
import { type AccountingSettings } from "@mms/shared";
import { DollarSign } from "lucide-react";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { SectionCard } from "@/components/ui/SectionCard";
import { AccountingSettingsField } from "./AccountingSettingsField";
import { DATE_FORMATS } from "./accountingSettingsPreferencesShared";

type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

interface AccountingSettingsCurrencySectionProps {
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
  currencies: CurrencyOption[];
  activeCurrency: CurrencyOption | undefined;
  decimalSeparators: { label: string; value: string }[];
}

export function AccountingSettingsCurrencySection({
  settingsDraft,
  upd,
  currencies,
  activeCurrency,
  decimalSeparators,
}: AccountingSettingsCurrencySectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard title={t("accounting.settings.secCurrency")} icon={DollarSign}>
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
            label: `${currencyOption.symbol} ${currencyOption.code} – ${currencyOption.name}`,
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
    </SectionCard>
  );
}
