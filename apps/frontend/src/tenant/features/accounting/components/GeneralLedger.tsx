import React from "react";
import { Account, JournalEntry } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { useGeneralLedger } from "@/tenant/features/accounting/components/useGeneralLedger";
import { exportGeneralLedgerCsv } from "@/tenant/features/accounting/components/generalLedgerExport";
import {
  GeneralLedgerFilters,
} from "@/tenant/features/accounting/components/GeneralLedgerFilters";
import {
  GeneralLedgerAccountSummary,
} from "@/tenant/features/accounting/components/GeneralLedgerAccountSummary";
import {
  GeneralLedgerEntries,
} from "@/tenant/features/accounting/components/GeneralLedgerEntries";

interface GeneralLedgerProps {
  accounts: Account[];
  entries: JournalEntry[];
}

/**
 * GeneralLedger component.
 *
 * Displays the ledger for a specific account.
 */
export function GeneralLedger({ accounts, entries }: GeneralLedgerProps) {
  const { t } = useTranslation();
  const ledger = useGeneralLedger(accounts, entries);

  const exportCSV = () => {
    if (!ledger.activeAccount) return;
    exportGeneralLedgerCsv(ledger.activeAccount, ledger.linesWithRunning, t);
  };

  return (
    <section aria-label={t("accounting.ledger.aria")} className="space-y-4">
      <GeneralLedgerFilters
        typeFilter={ledger.typeFilter}
        selectedAccount={ledger.selectedAccount}
        dateFrom={ledger.dateFrom}
        dateTo={ledger.dateTo}
        filteredAccounts={ledger.filteredAccounts}
        onTypeFilterChange={ledger.setTypeFilter}
        onSelectedAccountChange={ledger.setSelectedAccount}
        onDateFromChange={ledger.setDateFrom}
        onDateToChange={ledger.setDateTo}
      />

      {!ledger.selectedAccount && (
        <div className="py-20 text-center rounded-xl border border-border text-sm text-muted-foreground" role="status">
          <p className="text-2xl mb-2" aria-hidden="true">📒</p>
          {t("accounting.ledger.selectInstruction")}
        </div>
      )}

      {ledger.selectedAccount && ledger.activeAccount && (
        <>
          <GeneralLedgerAccountSummary
            activeAccount={ledger.activeAccount}
            totalDebit={ledger.totalDebit}
            totalCredit={ledger.totalCredit}
            balance={ledger.balance}
            onExport={exportCSV}
          />
          <GeneralLedgerEntries
            activeAccount={ledger.activeAccount}
            linesWithRunning={ledger.linesWithRunning}
            totalDebit={ledger.totalDebit}
            totalCredit={ledger.totalCredit}
            balance={ledger.balance}
            dateFrom={ledger.dateFrom}
            dateTo={ledger.dateTo}
          />
        </>
      )}
    </section>
  );
}
