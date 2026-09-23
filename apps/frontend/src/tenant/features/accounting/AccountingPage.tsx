import React, { useState, useEffect } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useAccountingPageShortcuts } from "@/tenant/features/accounting/hooks/useAccountingPageShortcuts";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrashMode } from "@/hooks/useTrashMode";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { AnimatePresence } from "framer-motion";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AccountingPageHeaderActions } from "@/tenant/features/accounting/components/AccountingPageHeaderActions";
import { AccountingWorkTier } from "@/tenant/features/accounting/components/AccountingWorkTier";
import { AccountingCommandMetrics } from "@/tenant/features/accounting/components/AccountingCommandMetrics";

const AccountingReportsTier = React.lazy(() =>
  import("@/tenant/features/accounting/components/AccountingReportsTier").then((m) => ({
    default: m.AccountingReportsTier,
  }))
);
const AccountingSetupTier = React.lazy(() =>
  import("@/tenant/features/accounting/components/AccountingSetupTier").then((m) => ({
    default: m.AccountingSetupTier,
  }))
);
import { useAccountingJournalColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingJournalColumnLayout";
import { useAccountingAccountColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingAccountColumnLayout";
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import {
  ACCOUNTING_MODULE_MANIFEST,
  type Account,
  type JournalEntry,
  type FiscalYear,
} from "@mms/shared";
import {
  useAccountingFiscalYearsPaginated,
  useAllAccountingAccounts,
  useAllAccountingEntries,
} from "./hooks/useAccountingApi";
import {
  useAccountingEntriesPage,
} from "./hooks/accountingListFetch";
import {
  JOURNAL_PAGE_SIZE,
  useJournalEntriesListQueryState,
} from "@/tenant/features/accounting/components/journalEntriesControllerFilters";
import { useAccountingPageActions } from "@/tenant/features/accounting/hooks/useAccountingPageActions";
import {
  ACCOUNTING_PAGE_ICON,
  ACCOUNTING_SUB_TAB_ICONS,
  ACCOUNTING_SUB_TAB_IDS,
  ACCOUNTING_SUB_TAB_KEYS,
} from "@/tenant/features/accounting/accountingPageSubTabs";

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
  const SUB_TABS = (() => ACCOUNTING_SUB_TAB_IDS.map((subTabId) => ({
      id: subTabId,
      label: t(ACCOUNTING_SUB_TAB_KEYS[subTabId]),
      icon: ACCOUNTING_SUB_TAB_ICONS[subTabId],
    })))();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("accounting_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [showDeleted, setShowDeleted] = useTrashMode();
  const [createJournalRequestKey, setCreateJournalRequestKey] = useState(0);

  /**
   * The chart of accounts is fetched whole (paged through internally). A single
   * `page: 1, limit: 100` slice of a default `createdAt desc` order returned only
   * the 100 newest accounts, silently dropping the rest from the chart, the
   * journal account picker, every report and the duplicate-code check.
   */
  const accountsResult = useAllAccountingAccounts({ includeDeleted: false });

  /**
   * The Journal list is server-driven: the filters, the order (`date desc`) and
   * the page live in the request, so the server counts and returns the matching
   * rows instead of the browser narrowing whichever 100 happened to load first.
   */
  const journalList = useJournalEntriesListQueryState(showDeleted);
  const entriesResult = useAccountingEntriesPage(journalList.query);
  const fiscalYearsResult = useAccountingFiscalYearsPaginated({ page: 1, limit: 100 });

  /**
   * The whole-ledger views need every entry, not page 1 of 100: computing the
   * Trial Balance / Overview / General Ledger from a capped slice understates
   * every account while the balance badge still reads "Balanced". Fetched only
   * while one of those sub-tabs is open, and kept separate from `journalEntries`
   * so saving an entry never re-uploads the entire journal.
   */
  const aggregateSubTab = activeTab === "work" && (activeSubTab === "overview" || activeSubTab === "ledger" || activeSubTab === "trial");
  const aggregateEntriesResult = useAllAccountingEntries(
    { includeDeleted: false },
    { enabled: aggregateSubTab },
  );
  const accountsEnvelope = accountsResult.data as { body?: { accounts?: Account[] }; accounts?: Account[] } | null;
  const fiscalYearsEnvelope = fiscalYearsResult.data as { body?: { fiscalYears?: FiscalYear[] }; fiscalYears?: FiscalYear[] } | null;
  const accounts: Account[] = Array.isArray(accountsResult.data)
    ? accountsResult.data
    : (accountsEnvelope?.body?.accounts ?? accountsEnvelope?.accounts ?? []);
  const journalEntries: JournalEntry[] = entriesResult.data?.entries ?? [];
  /**
   * The server's count of every entry matching the active filters — the number
   * the pager and the "shown" metric read. `journalEntries.length` is only the
   * rows on this page.
   */
  const journalTotal = entriesResult.data?.total ?? 0;
  const aggregateEntries: JournalEntry[] = aggregateEntriesResult.data ?? [];
  const fiscalYears: FiscalYear[] = fiscalYearsEnvelope?.body?.fiscalYears ?? fiscalYearsEnvelope?.fiscalYears ?? [];
  const { settings } = useAccountingConfig();
  const { activeCurrency } = useAccountingCurrency();
  const [filteredCount, setFilteredCount] = useState(0);
  const journalColumnLayout = useAccountingJournalColumnLayout();
  const accountColumnLayout = useAccountingAccountColumnLayout();

  const {
    setAccounts,
    setEntries,
    setFiscalYears,
    handleDeleteEntry,
    handleRestoreEntry,
    handleBulkDeleteEntries,
    handleBulkRestoreEntries,
  } = useAccountingPageActions({ accounts, journalEntries, fiscalYears });

  useEffect(() => {
    // The Journal list reports itself (server total for the active filter) and
    // the chart of accounts reports its own count; the remaining sub-tabs show
    // the whole journal, so mirror that count instead.
    if (activeSubTab === "journal" || activeSubTab === "coa") return;
    setFilteredCount(journalTotal);
  }, [activeSubTab, journalTotal]);

  const openJournalCreate = () => {
    setActiveTab("work");
    setActiveSubTab("journal");
    setCreateJournalRequestKey((key) => key + 1);
  };

  const { handleShortcutStateChange } = useAccountingPageShortcuts({
    activeTab,
    activeSubTab,
    canWrite,
    showDeleted,
    openJournalCreate,
    journalList,
  });

  const activeFiscalYear = fiscalYears.find((fiscalYear) => fiscalYear.status === "active");
  const listLoadFailed =
    accountsResult.isError
    || entriesResult.isError
    || (aggregateSubTab && aggregateEntriesResult.isError);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.accounting")}`}
      seoDescription={t("page.accounting.subtitle")}
      headerIcon={ACCOUNTING_PAGE_ICON}
      headerTitle={t("nav.accounting")}
      headerSubtitle={`${t("page.accounting.subtitle")}${activeFiscalYear ? ` · ${activeFiscalYear.label}` : ""} · ${activeCurrency.code}`}
      headerActions={
        <AccountingPageHeaderActions
          canWrite={canWrite}
          showDeleted={showDeleted}
          activeFiscalYear={activeFiscalYear}
          onCreateJournal={openJournalCreate}
        />
      }
      metricsStrip={
        <AccountingCommandMetrics entryTotal={journalTotal} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="accounting-tab"
      >
      <AnimatePresence mode="wait">
        <ModuleTierMotion
          tier={activeTab + "-" + activeSubTab + "-" + String(showDeleted)}
          className="space-y-4"
        >

          <ErrorBoundary>
          {activeTab === "reports" && (
            <React.Suspense fallback={<RouteStatusFallback />}>
              <AccountingReportsTier />
            </React.Suspense>
          )}

          {activeTab === "work" && (
            <AccountingWorkTier
              accounts={accounts}
              entries={journalEntries}
              aggregateEntries={aggregateEntries}
              fiscalYears={fiscalYears}
              settings={settings}
              activeSubTab={activeSubTab}
              subTabs={SUB_TABS}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              listLoadFailed={listLoadFailed}
              journalFilters={journalList.filters}
              onJournalFiltersChange={journalList.patchFilters}
              journalPaging={{
                page: journalList.page,
                limit: JOURNAL_PAGE_SIZE,
                total: journalTotal,
                hasMore: entriesResult.data?.hasMore ?? false,
                onPageChange: journalList.setPage,
              }}
              createJournalRequestKey={createJournalRequestKey}
              onSubTabChange={(next) => {
                setActiveSubTab(next);
                if (next !== "journal") setShowDeleted(false);
              }}
              onShowDeletedChange={() => setShowDeleted((prev) => !prev)}
              onRetry={() => {
                void accountsResult.refetch();
                void entriesResult.refetch();
                void aggregateEntriesResult.refetch();
              }}
              onAccountsChange={setAccounts}
              onEntriesChange={setEntries}
              onFilteredCountChange={setFilteredCount}
              onShortcutStateChange={handleShortcutStateChange}
              onDeleteEntry={handleDeleteEntry}
              onRestoreEntry={handleRestoreEntry}
              onBulkDeleteEntries={handleBulkDeleteEntries}
              onBulkRestoreEntries={handleBulkRestoreEntries}
              journalColumnProps={{
                isColumnVisible: journalColumnLayout.isColumnVisible,
                getColumnWidth: journalColumnLayout.getColumnWidth,
                onColumnResize: journalColumnLayout.setColumnWidth,
                columnCustomizer: {
                  columnRegistry: journalColumnLayout.columnRegistry,
                  updateUserColumnLayout: journalColumnLayout.updateUserColumnLayout,
                  labels: journalColumnLayout.customizerLabels,
                },
              }}
              accountColumnProps={{
                isColumnVisible: accountColumnLayout.isColumnVisible,
                getColumnWidth: accountColumnLayout.getColumnWidth,
                onColumnResize: accountColumnLayout.setColumnWidth,
                columnCustomizer: {
                  columnRegistry: accountColumnLayout.columnRegistry,
                  updateUserColumnLayout: accountColumnLayout.updateUserColumnLayout,
                  labels: accountColumnLayout.customizerLabels,
                },
              }}
              showActiveLabel={t("accounting.trash.showActive")}
              showDeletedLabel={t("accounting.trash.showDeleted")}
              loadFailedTitle={t("accounting.loadFailed")}
            />
          )}

          {activeTab === "setup" && (
            <React.Suspense fallback={<RouteStatusFallback />}>
              <AccountingSetupTier
                accounts={accounts}
                fiscalYears={fiscalYears}
                onSaveFiscalYears={setFiscalYears}
              />
            </React.Suspense>
          )}
          </ErrorBoundary>
        </ModuleTierMotion>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </ModulePageShell>
  );
}
