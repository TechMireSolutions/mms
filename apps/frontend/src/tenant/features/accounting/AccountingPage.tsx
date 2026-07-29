import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, List, BookMarked, Scale,
  BookOpen, LayoutDashboard, Plus,
} from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { ErrorState } from "@/components/ui/ErrorState";
import { ChartOfAccounts } from "@/tenant/features/accounting/components/ChartOfAccounts";
import { JournalEntries } from "@/tenant/features/accounting/components/JournalEntries";
import { GeneralLedger } from "@/tenant/features/accounting/components/GeneralLedger";
import { TrialBalance } from "@/tenant/features/accounting/components/TrialBalance";
import { FinancialReports } from "@/tenant/features/accounting/components/FinancialReports";
import { AccountingSettings } from "@/tenant/features/accounting/components/AccountingSettings";
import { AccountingDashboard } from "@/tenant/features/accounting/components/AccountingDashboard";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AccountingCommandMetrics } from "@/tenant/features/accounting/components/AccountingCommandMetrics";
import { useAccountingJournalColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingJournalColumnLayout";
import { useAccountingAccountColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingAccountColumnLayout";
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { ACCOUNTING_MODULE_MANIFEST, type Account, type JournalEntry, type FiscalYear } from "@mms/shared";
import {
  useAccountingAccounts,
  useAccountingEntries,
  useAccountingFiscalYears,
  useAccountingMutations,
  NotifiedAccountingMutationError,
} from "@/tenant/features/accounting/hooks/useAccountingApi";
import { notify } from "@/lib/notify";

const SUB_TAB_IDS = ["overview", "journal", "ledger", "trial", "coa"] as const;
type SubTabId = (typeof SUB_TAB_IDS)[number];

const SUB_TAB_ICONS: Record<SubTabId, React.ElementType> = {
  overview: LayoutDashboard,
  journal: List,
  ledger: BookMarked,
  trial: Scale,
  coa: BookOpen,
};

const SUB_TAB_KEYS: Record<SubTabId, "accounting.tabs.overview" | "accounting.tabs.journal" | "accounting.tabs.ledger" | "accounting.tabs.trial" | "accounting.tabs.coa"> = {
  overview: "accounting.tabs.overview",
  journal: "accounting.tabs.journal",
  ledger: "accounting.tabs.ledger",
  trial: "accounting.tabs.trial",
  coa: "accounting.tabs.coa",
};

/**
 * Accounting and bookkeeping — Work | Reports | Setup.
 */
export default function Accounting() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(ACCOUNTING_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SUB_TABS = useMemo(
    () => SUB_TAB_IDS.map((subTabId) => ({
      id: subTabId,
      label: t(SUB_TAB_KEYS[subTabId]),
      icon: SUB_TAB_ICONS[subTabId],
    })),
    [t]
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("accounting_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [showDeleted, setShowDeleted] = useState(false);
  const [createJournalRequestKey, setCreateJournalRequestKey] = useState(0);

  const accountsResult = useAccountingAccounts({ includeDeleted: false });
  const entriesResult = useAccountingEntries({ includeDeleted: showDeleted });
  const fiscalYearsResult = useAccountingFiscalYears();
  const accounts = accountsResult.syncedData;
  const journalEntries = entriesResult.syncedData;
  const fiscalYears = fiscalYearsResult.syncedData;
  const { settings } = useAccountingConfig();
  const { activeCurrency } = useAccountingCurrency();
  const [filteredCount, setFilteredCount] = useState(0);
  const journalColumnLayout = useAccountingJournalColumnLayout();
  const accountColumnLayout = useAccountingAccountColumnLayout();

  const {
    replaceAccounts,
    replaceEntries,
    replaceFiscalYears,
    deleteEntry,
    restoreEntry,
    bulkDeleteEntries,
    bulkRestoreEntries,
  } = useAccountingMutations();

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedAccountingMutationError) return;
    notify.error(t("accounting.settings.saveEntriesFailed"), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const setAccounts = useCallback(async (updater: Account[] | ((prev: Account[]) => Account[])) => {
    const nextAccounts = typeof updater === "function" ? updater(accounts) : updater;
    try {
      await replaceAccounts.mutateAsync(nextAccounts);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [accounts, replaceAccounts, notifySaveFailure]);

  const setEntries = useCallback(async (updater: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => {
    const nextJournalEntries = typeof updater === "function" ? updater(journalEntries) : updater;
    try {
      await replaceEntries.mutateAsync(nextJournalEntries);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [journalEntries, replaceEntries, notifySaveFailure]);

  const setFiscalYears = useCallback(async (updater: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[])) => {
    const nextFiscalYears = typeof updater === "function" ? updater(fiscalYears) : updater;
    try {
      await replaceFiscalYears.mutateAsync(nextFiscalYears);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [fiscalYears, replaceFiscalYears, notifySaveFailure]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      notify.success(t("accounting.trash.deleted"));
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [deleteEntry, t]);

  const handleRestoreEntry = useCallback(async (id: string) => {
    try {
      await restoreEntry.mutateAsync(id);
      notify.success(t("accounting.trash.restored"));
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [restoreEntry, t]);

  const handleBulkDeleteEntries = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntries.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("accounting.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("accounting.trash.deleted"));
      }
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [bulkDeleteEntries, t]);

  const handleBulkRestoreEntries = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkRestoreEntries.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("accounting.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("accounting.trash.restored"));
      }
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [bulkRestoreEntries, t]);

  useEffect(() => {
    if (activeSubTab === "journal" || activeSubTab === "coa") return;
    setFilteredCount(journalEntries.length);
  }, [activeSubTab, journalEntries.length]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveSubTab("journal");
      setCreateJournalRequestKey((key) => key + 1);
    },
  });

  const activeFiscalYear = fiscalYears.find((fiscalYear) => fiscalYear.status === "active");
  const listLoadFailed = accountsResult.queryResult.isError || entriesResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.accounting")}`}
      seoDescription={t("page.accounting.subtitle")}
      headerIcon={TrendingUp}
      headerTitle={t("nav.accounting")}
      headerSubtitle={`${t("page.accounting.subtitle")}${activeFiscalYear ? ` · ${activeFiscalYear.label}` : ""} · ${activeCurrency.code}`}
      headerActions={
        <div className="flex items-center gap-2">
          {canWrite && !showDeleted ? (
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => {
                setActiveTab("work");
                setActiveSubTab("journal");
                setCreateJournalRequestKey((key) => key + 1);
              }}
            >
              {t("accounting.journal.dashboard.newEntry")}
            </ActionButton>
          ) : null}
          {activeFiscalYear && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
              {t("page.accounting.activeBadge", { label: activeFiscalYear.label })}
            </span>
          )}
        </div>
      }
      metricsStrip={
        <AccountingCommandMetrics entryTotal={journalEntries.length} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="accounting-tab"
      >
      {activeTab === "work" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SubTabBar
            tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={activeSubTab}
            onChange={(next) => {
              setActiveSubTab(next);
              if (next !== "journal") setShowDeleted(false);
            }}
          />
          {activeSubTab === "journal" && canDelete && (
            <ModuleTrashToggle
              showDeleted={showDeleted}
              onToggle={() => setShowDeleted((prev) => !prev)}
              showActiveLabel={t("accounting.trash.showActive")}
              showDeletedLabel={t("accounting.trash.showDeleted")}
              className="gap-1.5 shrink-0"
            />
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeTab + "-" + activeSubTab + "-" + String(showDeleted)}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          <ErrorBoundary>
          {activeTab === "reports" && (
            <div className="space-y-4">
              <KPISummary category="accounting" />
              <FinancialReports
                accounts={accounts}
                entries={journalEntries}
                fiscalYears={fiscalYears}
                settings={settings}
              />
            </div>
          )}

          {activeTab === "work" && listLoadFailed && (
            <ErrorState
              title={t("accounting.loadFailed")}
              onRetry={() => {
                void accountsResult.queryResult.refetch();
                void entriesResult.queryResult.refetch();
              }}
            />
          )}

          {activeTab === "work" && !listLoadFailed && activeSubTab === "overview" && (
            <AccountingDashboard accounts={accounts} entries={journalEntries} settings={settings} fiscalYears={fiscalYears} />
          )}

          {activeTab === "work" && !listLoadFailed && activeSubTab === "journal" && (
            <JournalEntries
              entries={journalEntries}
              accounts={accounts}
              settings={settings}
              fiscalYears={fiscalYears}
              onChange={setEntries}
              onFilteredCountChange={setFilteredCount}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              createRequestKey={createJournalRequestKey}
              onDelete={handleDeleteEntry}
              onRestore={handleRestoreEntry}
              onBulkDelete={handleBulkDeleteEntries}
              onBulkRestore={handleBulkRestoreEntries}
              isColumnVisible={journalColumnLayout.isColumnVisible}
              getColumnWidth={journalColumnLayout.getColumnWidth}
              onColumnResize={journalColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: journalColumnLayout.columnRegistry,
                updateUserColumnLayout: journalColumnLayout.updateUserColumnLayout,
                labels: journalColumnLayout.customizerLabels,
              }}
            />
          )}
          {activeTab === "work" && !listLoadFailed && activeSubTab === "ledger" && (
            <GeneralLedger accounts={accounts} entries={journalEntries} />
          )}
          {activeTab === "work" && !listLoadFailed && activeSubTab === "trial" && (
            <TrialBalance accounts={accounts} entries={journalEntries} fiscalYears={fiscalYears} />
          )}
          {activeTab === "work" && !listLoadFailed && activeSubTab === "coa" && (
            <ChartOfAccounts
              accounts={accounts}
              onChange={setAccounts}
              onFilteredCountChange={setFilteredCount}
              canWrite={canWrite}
              isColumnVisible={accountColumnLayout.isColumnVisible}
              getColumnWidth={accountColumnLayout.getColumnWidth}
              onColumnResize={accountColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: accountColumnLayout.columnRegistry,
                updateUserColumnLayout: accountColumnLayout.updateUserColumnLayout,
                labels: accountColumnLayout.customizerLabels,
              }}
            />
          )}
          {activeTab === "setup" && (
            <AccountingSettings
              accounts={accounts}
              fiscalYears={fiscalYears}
              onSaveFiscalYears={setFiscalYears}
            />
          )}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}
