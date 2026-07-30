import React, { useState, useEffect, useMemo } from "react";
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
import { ActionButton } from "@/components/ui/ActionButton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AccountingReportsTier } from "@/tenant/features/accounting/components/AccountingReportsTier";
import { AccountingSetupTier } from "@/tenant/features/accounting/components/AccountingSetupTier";
import { AccountingWorkTier } from "@/tenant/features/accounting/components/AccountingWorkTier";
import { AccountingCommandMetrics } from "@/tenant/features/accounting/components/AccountingCommandMetrics";
import { useAccountingJournalColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingJournalColumnLayout";
import { useAccountingAccountColumnLayout } from "@/tenant/features/accounting/hooks/useAccountingAccountColumnLayout";
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { ACCOUNTING_MODULE_MANIFEST } from "@mms/shared";
import {
  useAccountingAccounts,
  useAccountingEntries,
  useAccountingFiscalYears,
} from "@/tenant/features/accounting/hooks/useAccountingApi";
import { useAccountingPageActions } from "@/tenant/features/accounting/hooks/useAccountingPageActions";

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
                void accountsResult.queryResult.refetch();
                void entriesResult.queryResult.refetch();
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
