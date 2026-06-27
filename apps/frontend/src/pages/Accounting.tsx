import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, List, BookMarked, Scale,
  BookOpen, LayoutDashboard,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useConfigSubTabs } from "@/hooks/useConfigSubTabs";
import { ChartOfAccounts } from "../components/accounting/ChartOfAccounts";
import { JournalEntries } from "../components/accounting/JournalEntries";
import { GeneralLedger } from "../components/accounting/GeneralLedger";
import { TrialBalance } from "../components/accounting/TrialBalance";
import { FinancialReports } from "../components/accounting/FinancialReports";
import { AccountingSettings } from "../components/accounting/AccountingSettings";
import { AccountingDashboard } from "../components/accounting/AccountingDashboard";
import KPISummary from "../components/reports/KPISummary";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { AccountingCommandMetrics } from "../components/accounting/AccountingCommandMetrics";
import { useAccountingJournalColumnLayout } from "@/hooks/useAccountingJournalColumnLayout";
import { useAccountingAccountColumnLayout } from "@/hooks/useAccountingAccountColumnLayout";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useAccountingConfig } from "@/hooks/useAccountingConfig";
import { DEFAULT_CURRENCIES } from "@mms/shared";
import {
  useAccountingAccountsCollection,
  useAccountingEntriesCollection,
  useAccountingFiscalYearsCollection,
  useAccountingMutations,
} from "@/hooks/useAccountingApi";

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
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const SUB_TABS = useMemo(
    () => SUB_TAB_IDS.map((id) => ({
      id,
      label: t(SUB_TAB_KEYS[id]),
      icon: SUB_TAB_ICONS[id],
    })),
    [t]
  );
  const [activeTab, setActiveTab]     = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [configSubTab, setConfigSubTab] = useState<"fields" | "preferences">("fields");
  const accounts = useAccountingAccountsCollection();
  const entries = useAccountingEntriesCollection();
  const fiscalYears = useAccountingFiscalYearsCollection();
  const currencies = useLiveCollection<any>("currencies", DEFAULT_CURRENCIES);
  const { settings } = useAccountingConfig();
  const [filteredCount, setFilteredCount] = useState(0);
  const journalColumnLayout = useAccountingJournalColumnLayout();
  const accountColumnLayout = useAccountingAccountColumnLayout();

  const { replaceAccounts, replaceEntries, replaceFiscalYears } = useAccountingMutations();

  const setAccounts = useCallback((updater: typeof accounts | ((prev: typeof accounts) => typeof accounts)) => {
    const next = typeof updater === "function" ? updater(accounts) : updater;
    replaceAccounts.mutate(next);
  }, [accounts, replaceAccounts]);

  const setEntries = useCallback((updater: typeof entries | ((prev: typeof entries) => typeof entries)) => {
    const next = typeof updater === "function" ? updater(entries) : updater;
    replaceEntries.mutate(next);
  }, [entries, replaceEntries]);

  const setFiscalYears = useCallback((updater: typeof fiscalYears | ((prev: typeof fiscalYears) => typeof fiscalYears)) => {
    const next = typeof updater === "function" ? updater(fiscalYears) : updater;
    replaceFiscalYears.mutate(next);
  }, [fiscalYears, replaceFiscalYears]);

  useEffect(() => {
    if (activeSubTab === 'journal' || activeSubTab === 'coa') return;
    setFilteredCount(entries.length);
  }, [activeSubTab, entries.length]);

  const activeFY = fiscalYears.find((f) => f.status === "active");
  const cur = currencies.find((c) => c.code === settings.currency) || currencies[0] || { symbol: "$", code: "USD", name: "US Dollar" };
  const fmt = (n: number) => `${cur.symbol} ${n.toLocaleString(undefined, { minimumFractionDigits: settings.decimalPlaces })}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Accounting Ledgers</title>
      <meta name="description" content="View double-entry bookkeeping journals, manage fiscal years, and generate accounting balance reports." />
      <PageHeader
        icon={TrendingUp}
        title={t("nav.accounting")}
        subtitle={`${t("page.accounting.subtitle")}${activeFY ? ` · ${activeFY.label}` : ""} · ${cur.code}`}
        actions={
          activeFY && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
              {activeFY.label} — Active
            </span>
          )
        }
      />

      <AccountingCommandMetrics entryTotal={entries.length} shown={filteredCount} />

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
                entries={entries}
                fiscalYears={fiscalYears}
                settings={settings}
                fmt={fmt}
              />
            </div>
          )}
          
          {activeTab === "work" && activeSubTab === "overview" && (
            <AccountingDashboard accounts={accounts} entries={entries} settings={settings} fiscalYears={fiscalYears} fmt={fmt} />
          )}

          {activeTab === "work" && activeSubTab === "journal" && (
            <JournalEntries
              entries={entries}
              accounts={accounts}
              settings={settings}
              fiscalYears={fiscalYears}
              onChange={setEntries}
              fmt={fmt}
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
            <GeneralLedger accounts={accounts} entries={entries} fmt={fmt} />
          )}
          {activeTab === "work" && activeSubTab === "trial" && (
            <TrialBalance accounts={accounts} entries={entries} fiscalYears={fiscalYears} fmt={fmt} />
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
            <div className="space-y-4">
              <SubTabBar
                tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
                value={configSubTab}
                onChange={(key) => setConfigSubTab(key as typeof configSubTab)}
              />
              <AccountingSettings
                accounts={accounts}
                fiscalYears={fiscalYears}
                onSaveFiscalYears={setFiscalYears}
                mode={configSubTab}
              />
            </div>
          )}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </div>
  );
}