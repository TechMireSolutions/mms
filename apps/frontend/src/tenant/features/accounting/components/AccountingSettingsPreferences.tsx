import type React from "react";
import { type AccountingSettings } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear } from "@/lib/data/accountingData";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { AccountingSettingsField } from "./AccountingSettingsField";
import { SectionCard } from "@/components/ui/SectionCard";
import { AccountingSettingsCurrencySection } from "./AccountingSettingsCurrencySection";
import { AccountingSettingsFiscalYearsSection } from "./AccountingSettingsFiscalYearsSection";
import { AccountingSettingsRulesSection } from "./AccountingSettingsRulesSection";

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

  return (
    <div className="space-y-6">
      <SectionCard title={t("accounting.settings.secOrganisation")}>
        <AccountingSettingsField label={t("accounting.settings.fields.organisationName")} hint={t("accounting.settings.fields.organisationNameHint")}>
          <Input value={settingsDraft.organizationName || ""} aria-label={t("accounting.settings.fields.organisationName")} onChange={(event) => upd("organizationName", event.target.value)} />
        </AccountingSettingsField>
      </SectionCard>

      <AccountingSettingsCurrencySection
        settingsDraft={settingsDraft}
        upd={upd}
        currencies={currencies}
        activeCurrency={activeCurrency}
        decimalSeparators={decimalSeparators}
      />

      <AccountingSettingsFiscalYearsSection
        fiscalYears={fiscalYears}
        settingsDraft={settingsDraft}
        upd={upd}
        fyStatusConfig={fyStatusConfig}
        canEditSetup={canEditSetup}
        onEditFiscalYear={onEditFiscalYear}
        onDeleteFiscalYear={onDeleteFiscalYear}
      />

      <AccountingSettingsRulesSection
        accounts={accounts}
        settingsDraft={settingsDraft}
        upd={upd}
      />
    </div>
  );
}
