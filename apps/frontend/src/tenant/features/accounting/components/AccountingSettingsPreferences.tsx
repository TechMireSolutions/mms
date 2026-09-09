import { type AccountingSettings, type Account, type FiscalYear } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { AccountingSettingsCurrencySection } from "./AccountingSettingsCurrencySection";
import { AccountingSettingsFiscalYearsSection } from "./AccountingSettingsFiscalYearsSection";
import { AccountingSettingsRulesSection } from "./AccountingSettingsRulesSection";
import { AccountingSettingsPostingSection } from "./AccountingSettingsPostingSection";
import { AccountingSettingsOpeningSection } from "./AccountingSettingsOpeningSection";
import { AccountingSettingsBankRecSection } from "./AccountingSettingsBankRecSection";

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
  onCloseFiscalYear?: (fiscalYearId: string) => void;
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
  onCloseFiscalYear,
}: AccountingSettingsPreferencesProps): React.JSX.Element {
  return (
    <div className="space-y-6">
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
        onCloseFiscalYear={onCloseFiscalYear}
      />

      <AccountingSettingsRulesSection
        accounts={accounts}
        settingsDraft={settingsDraft}
        upd={upd}
      />

      <AccountingSettingsPostingSection accounts={accounts} />
      <AccountingSettingsOpeningSection accounts={accounts} fiscalYears={fiscalYears} />
      <AccountingSettingsBankRecSection accounts={accounts} />
    </div>
  );
}
