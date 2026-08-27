import type React from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { AccountingDashboard } from "@/tenant/features/accounting/components/AccountingDashboard";
import { ChartOfAccounts } from "@/tenant/features/accounting/components/ChartOfAccounts";
import { GeneralLedger } from "@/tenant/features/accounting/components/GeneralLedger";
import { JournalEntries } from "@/tenant/features/accounting/components/JournalEntries";
import { TrialBalance } from "@/tenant/features/accounting/components/TrialBalance";
import type { Account, AccountingSettings, FiscalYear, JournalEntry } from "@mms/shared";

type AccountingSubTab = {
  id: string;
  label: string;
};

type JournalColumnProps = Pick<
  React.ComponentProps<typeof JournalEntries>,
  "isColumnVisible" | "getColumnWidth" | "onColumnResize" | "columnCustomizer"
>;

type AccountColumnProps = Pick<
  React.ComponentProps<typeof ChartOfAccounts>,
  "isColumnVisible" | "getColumnWidth" | "onColumnResize" | "columnCustomizer"
>;

interface AccountingWorkTierProps {
  subTabs: AccountingSubTab[];
  activeSubTab: string;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  listLoadFailed: boolean;
  createJournalRequestKey?: number;
  createAccountRequestKey?: number;
  accounts: Account[];
  entries: JournalEntry[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
  onSubTabChange: (tab: string) => void;
  onShowDeletedChange: () => void;
  onRetry: () => void;
  onAccountsChange: (updater: Account[] | ((prev: Account[]) => Account[])) => Promise<void>;
  onEntriesChange: (updater: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => Promise<void>;
  onFilteredCountChange: (count: number) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onRestoreEntry: (id: string) => Promise<void>;
  onBulkDeleteEntries: (ids: string[]) => Promise<void>;
  onBulkRestoreEntries: (ids: string[]) => Promise<void>;
  journalColumnProps?: JournalColumnProps;
  accountColumnProps?: AccountColumnProps;
  showActiveLabel?: string;
  showDeletedLabel?: string;
  loadFailedTitle?: string;
}

export function AccountingWorkTier({
  subTabs,
  activeSubTab,
  canWrite,
  canDelete,
  showDeleted,
  listLoadFailed,
  createJournalRequestKey,
  createAccountRequestKey,
  accounts,
  entries,
  settings,
  fiscalYears,
  onSubTabChange,
  onShowDeletedChange,
  onRetry,
  onAccountsChange,
  onEntriesChange,
  onFilteredCountChange,
  onDeleteEntry,
  onRestoreEntry,
  onBulkDeleteEntries,
  onBulkRestoreEntries,
  journalColumnProps,
  accountColumnProps,
  showActiveLabel,
  showDeletedLabel,
  loadFailedTitle,
}: AccountingWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <SubTabBar
        tabs={subTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
        value={activeSubTab}
        onChange={onSubTabChange}
      />

      {listLoadFailed && (
        <ErrorState
          title={loadFailedTitle}
          description={t("accounting.loadFailedHint")}
          onRetry={onRetry}
        />
      )}

      {!listLoadFailed && activeSubTab === "overview" && (
        <AccountingDashboard accounts={accounts} entries={entries} settings={settings} fiscalYears={fiscalYears} />
      )}

      {!listLoadFailed && activeSubTab === "journal" && (
        <JournalEntries
          entries={entries}
          accounts={accounts}
          settings={settings}
          fiscalYears={fiscalYears}
          onChange={onEntriesChange}
          onFilteredCountChange={onFilteredCountChange}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          onToggleDeleted={onShowDeletedChange}
          createRequestKey={createJournalRequestKey}
          onDelete={onDeleteEntry}
          onRestore={onRestoreEntry}
          onBulkDelete={onBulkDeleteEntries}
          onBulkRestore={onBulkRestoreEntries}
          {...journalColumnProps}
        />
      )}

      {!listLoadFailed && activeSubTab === "ledger" && (
        <GeneralLedger accounts={accounts} entries={entries} />
      )}

      {!listLoadFailed && activeSubTab === "trial" && (
        <TrialBalance accounts={accounts} entries={entries} fiscalYears={fiscalYears} />
      )}

      {!listLoadFailed && activeSubTab === "coa" && (
        <ChartOfAccounts
          accounts={accounts}
          onChange={onAccountsChange}
          onFilteredCountChange={onFilteredCountChange}
          canWrite={canWrite}
          {...accountColumnProps}
        />
      )}
    </>
  );
}
