import type React from "react";
import KPISummary from "@/components/ui/reports/KPISummary";
import { FinancialReports } from "@/tenant/features/accounting/components/FinancialReports";
import type { Account, FiscalYear, JournalEntry } from "@mms/shared";

interface AccountingReportsTierProps {
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  settings: React.ComponentProps<typeof FinancialReports>["settings"];
}

export function AccountingReportsTier({
  accounts,
  entries,
  fiscalYears,
  settings,
}: AccountingReportsTierProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <KPISummary category="accounting" />
      <FinancialReports
        accounts={accounts}
        entries={entries}
        fiscalYears={fiscalYears}
        settings={settings}
      />
    </div>
  );
}
