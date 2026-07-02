import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, List, BookMarked, Scale,
  BookOpen, LayoutDashboard,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
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
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useAccountingConfig } from "@/tenant/features/accounting/hooks/useAccountingConfig";
import { DEFAULT_CURRENCIES } from "@mms/shared";
import {
  useAccountingAccountsCollection,
  useAccountingEntriesCollection,
  useAccountingFiscalYearsCollection,
  useAccountingMutations,
} from "@/tenant/features/accounting/hooks/useAccountingApi";

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
 *
 * @returns {React.ReactElement} The Accounting page component.
 */
export default function Accounting() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => SUB_TAB_IDS.map((subTabId) => ({
      id: subTabId,
      label: t(SUB_TAB_KEYS[subTabId]),
      icon: SUB_TAB_ICONS[subTabId],
    })),
    [t]
  );
  const [activeTab, setActiveTab]     = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const accounts = useAccountingAccountsCollection();
  const journalEntries = useAccountingEntriesCollection();
  const fiscalYears = useAccountingFiscalYearsCollection();
  const currencies = useLiveCollection<any>("currencies", DEFAULT_CURRENCIES);
  const { settings } = useAccountingConfig();
  const [filteredCount, setFilteredCount] = useState(0);
  const journalColumnLayout = useAccountingJournalColumnLayout();
  const accountColumnLayout = useAccountingAccountColumnLayout();

  const { replaceAccounts, replaceEntries, replaceFiscalYears } = useAccountingMutations();

  const setAccounts = useCallback((updater: typeof accounts | ((prev: typeof accounts) => typeof accounts)) => {
    const nextAccounts = typeof updater === "function" ? updater(accounts) : updater;
    replaceAccounts.mutate(nextAccounts);
  }, [accounts, replaceAccounts]);

  const setEntries = useCallback((updater: typeof journalEntries | ((prev: typeof journalEntries) => typeof journalEntries)) => {
    const nextJournalEntries = typeof updater === "function" ? updater(journalEntries) : updater;
    replaceEntries.mutate(nextJournalEntries);
  }, [journalEntries, replaceEntries]);

  const setFiscalYears = useCallback((updater: typeof fiscalYears | ((prev: typeof fiscalYears) => typeof fiscalYears)) => {
    const nextFiscalYears = typeof updater === "function" ? updater(fiscalYears) : updater;
    replaceFiscalYears.mutate(nextFiscalYears);
  }, [fiscalYears, replaceFiscalYears]);

  useEffect(() => {
    if (activeSubTab === 'journal' || activeSubTab === 'coa') return;
    setFilteredCount(journalEntries.length);
  }, [activeSubTab, journalEntries.length]);

  const activeFiscalYear = fiscalYears.find((fiscalYear) => fiscalYear.status === "active");
  const activeCurrency = currencies.find((currency) => currency.code === settings.currency) || currencies[0] || { symbol: "$", code: "USD", name: "US Dollar" };
  const formatCurrency = (amount: number) => `${activeCurrency.symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: settings.decimalPlaces })}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Accounting Ledgers</title>
      <meta name="description" content="View double-entry bookkeeping journals, manage fiscal years, and generate accounting balance reports." />
      <PageHeader
        icon={TrendingUp}
        title={t("nav.accounting")}
        subtitle={`${t("page.accounting.subtitle")}${activeFiscalYear ? ` · ${activeFiscalYear.label}` : ""} · ${activeCurrency.code}`}
        actions={
          activeFiscalYear && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
              {activeFiscalYear.label} — Active
            </span>
          )
        }
      />

      <AccountingCommandMetrics entryTotal={journalEntries.length} shown={filteredCount} />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="accounting-tab"
      >
      {/* Work tier sub-tabs */}
      {activeTab === "work" && (
        <SubTabBar
          tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={activeSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab + "-" + activeSubTab}
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
                formatCurrency={formatCurrency}
              />
            </div>
          )}
          
          {activeTab === "work" && activeSubTab === "overview" && (
            <AccountingDashboard accounts={accounts} entries={journalEntries} settings={settings} fiscalYears={fiscalYears} formatCurrency={formatCurrency} />
          )}

          {activeTab === "work" && activeSubTab === "journal" && (
            <JournalEntries
              entries={journalEntries}
              accounts={accounts}
              settings={settings}
              fiscalYears={fiscalYears}
              onChange={setEntries}
              formatCurrency={formatCurrency}
              onFilteredCountChange={setFilteredCount}
              isColumnVisible={journalColumnLayout.isColumnVisible}
              columnCustomizer={{
                columnRegistry: journalColumnLayout.columnRegistry,
                updateUserColumnLayout: journalColumnLayout.updateUserColumnLayout,
                labels: journalColumnLayout.customizerLabels,
              }}
            />
          )}
          {activeTab === "work" && activeSubTab === "ledger" && (
            <GeneralLedger accounts={accounts} entries={journalEntries} formatCurrency={formatCurrency} />
          )}
          {activeTab === "work" && activeSubTab === "trial" && (
            <TrialBalance accounts={accounts} entries={journalEntries} fiscalYears={fiscalYears} formatCurrency={formatCurrency} />
          )}
          {activeTab === "work" && activeSubTab === "coa" && (
            <ChartOfAccounts
              accounts={accounts}
              onChange={setAccounts}
              onFilteredCountChange={setFilteredCount}
              isColumnVisible={accountColumnLayout.isColumnVisible}
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
              mode="preferences"
            />
          )}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </div>
  );
}
