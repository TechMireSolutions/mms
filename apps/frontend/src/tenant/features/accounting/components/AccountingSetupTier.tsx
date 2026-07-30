import type React from "react";
import { AccountingSettings } from "@/tenant/features/accounting/components/AccountingSettings";
import type { Account, FiscalYear } from "@mms/shared";

interface AccountingSetupTierProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (updater: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[])) => Promise<void>;
}

export function AccountingSetupTier({
  accounts,
  fiscalYears,
  onSaveFiscalYears,
}: AccountingSetupTierProps): React.JSX.Element {
  return (
    <AccountingSettings
      accounts={accounts}
      fiscalYears={fiscalYears}
      onSaveFiscalYears={onSaveFiscalYears}
    />
  );
}
