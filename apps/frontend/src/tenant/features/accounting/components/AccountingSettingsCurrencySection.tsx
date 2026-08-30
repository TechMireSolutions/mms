import type React from "react";
import { type AccountingSettings } from "@mms/shared";
import { DollarSign } from "lucide-react";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
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
    <SectionCard
      title={t("accounting.settings.secCurrency")}
      icon={DollarSign}
      className={SETUP_SECTION_CARD_CLASS}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={t("accounting.settings.fields.baseCurrency")}
          hint={t("accounting.settings.fields.baseCurrencyHint")}
        >
          <FormSelect
            id="accounting-base-currency"
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
        </Field>

        <Field label={t("accounting.settings.fields.dateFormat")}>
          <FormSelect
            id="accounting-date-format"
            value={settingsDraft.dateFormat}
            onChange={(dateFormatValue) => upd("dateFormat", dateFormatValue)}
            options={DATE_FORMATS}
          />
        </Field>

        <Field label={t("accounting.settings.fields.numberFormat")}>
          <FormSelect
            id="accounting-decimal-separator"
            value={settingsDraft.decimalSeparator}
            onChange={(separatorValue) => upd("decimalSeparator", separatorValue as AccountingSettings["decimalSeparator"])}
            options={decimalSeparators}
          />
        </Field>

        <Field label={t("accounting.settings.fields.decimalPlaces")}>
          <FormSelect
            id="accounting-decimal-places"
            value={String(settingsDraft.decimalPlaces ?? 2)}
            onChange={(decimalPlacesValue) => upd("decimalPlaces", parseInt(decimalPlacesValue))}
            options={[0, 1, 2, 3].map((placeCount) => String(placeCount))}
            className="w-full sm:w-32"
          />
        </Field>
      </div>
    </SectionCard>
  );
}
