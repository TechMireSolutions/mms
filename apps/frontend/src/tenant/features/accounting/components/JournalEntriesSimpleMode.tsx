import type { FormEvent } from "react";

import { SubTabBar } from "@/components/ui/SubTabBar";
import { CashbookView } from "@/tenant/features/accounting/components/CashbookView";
import { JournalQuickActionsPanel } from "@/tenant/features/accounting/components/JournalQuickActionsPanel";
import { SimpleTransactionWizard } from "@/tenant/features/accounting/components/SimpleTransactionWizard";
import { SpecializedEntryModal } from "@/tenant/features/accounting/components/SpecializedEntryModal";
import type { QuickActionType } from "@/tenant/features/accounting/components/journalEntriesQuickActions";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear, JournalEntry } from "@/lib/data/accountingData";

/** Quick-action ids that open the dedicated cross-module entry modal instead of the generic wizard. */
const SPECIALIZED_ENTRY_TYPES = new Set(["fee_collection", "salary"]);

type JournalMode = "simple" | "advanced";
type JournalSubTab = "transactions" | "cashbook";

interface JournalEntriesSimpleModeProps {
  mode: JournalMode;
  tab: JournalSubTab;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  journalSubTabs: Array<{ key: JournalSubTab; label: string }>;
  entries: JournalEntry[];
  allEntries?: JournalEntry[];
  accounts: Account[];
  fiscalYears: FiscalYear[];
  canWrite: boolean;
  simpleModal: {
    prefillType: QuickActionType | null;
    initialAmount?: string;
    initialDescription?: string;
  } | null;
  nlInput: string;
  nlSuggestion: QuickActionType | null;
  onModeChange: (mode: JournalMode) => void;
  onTabChange: (tab: JournalSubTab) => void;
  onNlSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNlChange: (inputValue: string) => void;
  onOpenPrefill: (prefillType: QuickActionType | null) => void;
  onExportCsv: () => void;
  onSave: (entry: JournalEntry) => void | Promise<void>;
  onCloseSimpleModal: () => void;
  pageScopeLabel: string;
}

export function JournalEntriesSimpleMode({
  mode,
  tab,
  modeTabs,
  journalSubTabs,
  entries,
  allEntries,
  accounts,
  fiscalYears,
  canWrite,
  simpleModal,
  nlInput,
  nlSuggestion,
  onModeChange,
  onTabChange,
  onNlSubmit,
  onNlChange,
  onOpenPrefill,
  onExportCsv,
  onSave,
  onCloseSimpleModal,
  pageScopeLabel,
}: JournalEntriesSimpleModeProps) {
  const { t } = useTranslation();
  const specializedType = simpleModal?.prefillType && SPECIALIZED_ENTRY_TYPES.has(simpleModal.prefillType.id)
    ? simpleModal.prefillType.id === "fee_collection"
      ? "fee" as const
      : "salary" as const
    : null;

  return (
    <section aria-label={t("accounting.journal.simpleAria")} className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground m-0">{t("accounting.journal.dashboard.recordTransaction")}</h2>
          <p className="text-xs text-muted-foreground m-0">{t("accounting.journal.dashboard.subtitleSimple")}</p>
        </div>
        <SubTabBar tabs={modeTabs} value={mode} onChange={onModeChange} panelIdPrefix="journal-mode-simple" />
      </header>

      <SubTabBar
        tabs={journalSubTabs}
        value={tab}
        onChange={onTabChange}
        panelIdPrefix="journal-simple"
      />

      {tab === "cashbook" ? (
        <CashbookView entries={entries} accounts={accounts} pageScopeLabel={pageScopeLabel} />
      ) : (
        <JournalQuickActionsPanel
          entries={entries}
          canWrite={canWrite}
          nlInput={nlInput}
          nlSuggestion={nlSuggestion}
          onNlSubmit={onNlSubmit}
          onNlChange={onNlChange}
          onOpenPrefill={onOpenPrefill}
          onExportCsv={onExportCsv}
          pageScopeLabel={pageScopeLabel}
        />
      )}

      {canWrite && (
        <SimpleTransactionWizard
          open={simpleModal !== null && specializedType === null}
          accounts={accounts}
          entries={(allEntries && allEntries.length > 0) ? allEntries : entries}
          fiscalYears={fiscalYears}
          prefillType={simpleModal?.prefillType}
          prefillAmount={simpleModal?.initialAmount}
          prefillDescription={simpleModal?.initialDescription}
          onSave={onSave}
          onClose={onCloseSimpleModal}
        />
      )}

      {canWrite && specializedType !== null && (
        <SpecializedEntryModal type={specializedType} accounts={accounts} onClose={onCloseSimpleModal} />
      )}
    </section>
  );
}
