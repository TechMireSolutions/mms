import { type AccountingSettings, type Account, type FiscalYear } from "@mms/shared";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
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
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <SectionCard
        accentColor="primary"
        title={t("accounting.settings.secOrganisation")}
        icon={Building2}
        className={SETUP_SECTION_CARD_CLASS}
      >
        <Field
          label={t("accounting.settings.fields.organisationName")}
          hint={t("accounting.settings.fields.organisationNameHint")}
        >
          <Input
            id="accounting-org-name"
            className={FORM_INPUT}
            value={settingsDraft.organizationName || ""}
            aria-label={t("accounting.settings.fields.organisationName")}
            onChange={(event) => upd("organizationName", event.target.value)}
          />
        </Field>
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
