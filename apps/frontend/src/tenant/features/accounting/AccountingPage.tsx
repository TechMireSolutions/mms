import React, { useState, useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AccountingPageHeaderActions } from "@/tenant/features/accounting/components/AccountingPageHeaderActions";
import { AccountingReportsTier } from "@/tenant/features/accounting/components/AccountingReportsTier";
import { AccountingSetupTier } from "@/tenant/features/accounting/components/AccountingSetupTier";
import { AccountingWorkTier } from "@/tenant/features/accounting/components/AccountingWorkTier";
import { AccountingCommandMetrics } from "@/tenant/features/accounting/components/AccountingCommandMetrics";
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
  useAccountingAccountsPaginated,
  useAccountingEntriesPaginated,
  useAccountingFiscalYearsPaginated,
} from "./hooks/useAccountingApi";
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
  const SUB_TABS = useMemo(
    () => ACCOUNTING_SUB_TAB_IDS.map((subTabId) => ({
      id: subTabId,
      label: t(ACCOUNTING_SUB_TAB_KEYS[subTabId]),
      icon: ACCOUNTING_SUB_TAB_ICONS[subTabId],
    })),
    [t]
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("accounting_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [showDeleted, setShowDeleted] = useState(false);
  const [createJournalRequestKey, setCreateJournalRequestKey] = useState(0);

  const accountsResult = useAccountingAccountsPaginated({ includeDeleted: false, page: 1, limit: 100 });
  const entriesResult = useAccountingEntriesPaginated({ includeDeleted: showDeleted, page: 1, limit: 100 });
  const fiscalYearsResult = useAccountingFiscalYearsPaginated({ page: 1, limit: 100 });
  const accounts: Account[] = (accountsResult.data as any)?.body?.accounts ?? (accountsResult.data as any)?.accounts ?? [];
  const journalEntries: JournalEntry[] = (entriesResult.data as any)?.body?.entries ?? (entriesResult.data as any)?.entries ?? [];
  const fiscalYears: FiscalYear[] = (fiscalYearsResult.data as any)?.body?.fiscalYears ?? (fiscalYearsResult.data as any)?.fiscalYears ?? [];
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
    if (activeSubTab === "journal" || activeSubTab === "coa") return;
    setFilteredCount(journalEntries.length);
  }, [activeSubTab, journalEntries.length]);

  const openJournalCreate = () => {
    setActiveTab("work");
    setActiveSubTab("journal");
    setCreateJournalRequestKey((key) => key + 1);
  };

  useModuleShortcuts({
    searchInputId: "accounting-search-input",
    selectedCount: 0,
    hasActiveFilters: false,
    clearFilters: () => {},
    clearSelection: () => {},
    canWrite,
    showDeleted,
    onCreate: openJournalCreate,
    enabled: activeTab === "work",
  });

  const activeFiscalYear = fiscalYears.find((fiscalYear) => fiscalYear.status === "active");
  const listLoadFailed = accountsResult.isError || entriesResult.isError;

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
        <AccountingCommandMetrics entryTotal={journalEntries.length} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="accounting-tab"
      >
      <AnimatePresence mode="wait">
        <motion.div key={activeTab + "-" + activeSubTab + "-" + String(showDeleted)}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          <ErrorBoundary>
          {activeTab === "reports" && (
            <AccountingReportsTier
              accounts={accounts}
              entries={journalEntries}
              fiscalYears={fiscalYears}
              settings={settings}
            />
          )}

          {activeTab === "work" && (
            <AccountingWorkTier
              accounts={accounts}
              entries={journalEntries}
              fiscalYears={fiscalYears}
              settings={settings}
              activeSubTab={activeSubTab}
              subTabs={SUB_TABS}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              listLoadFailed={listLoadFailed}
              createJournalRequestKey={createJournalRequestKey}
              onSubTabChange={(next) => {
                setActiveSubTab(next);
                if (next !== "journal") setShowDeleted(false);
              }}
              onShowDeletedChange={() => setShowDeleted((prev) => !prev)}
              onRetry={() => {
                void accountsResult.refetch();
                void entriesResult.refetch();
              }}
              onAccountsChange={setAccounts}
              onEntriesChange={setEntries}
              onFilteredCountChange={setFilteredCount}
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
            <AccountingSetupTier
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
