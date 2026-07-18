import React, { useState, useMemo, useEffect } from "react";
import { formatDate, formatMoney, type AppTranslationKey } from "@mms/shared";
import {
  Plus, Eye, Pencil, Trash2, CheckCircle2,
  RotateCcw, Filter, Download, BookOpen,
  DollarSign, Heart, Zap, UserCheck, Layers,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { AnimatePresence } from "framer-motion";
import { JournalEntryForm } from "@/tenant/features/accounting/components/JournalEntryForm";
import { JournalEntryDetail } from "@/tenant/features/accounting/components/JournalEntryDetail";
import { SimpleTransactionWizard } from "@/tenant/features/accounting/components/SimpleTransactionWizard";
import { CashbookView } from "@/tenant/features/accounting/components/CashbookView";
import { createReversalEntry, JOURNAL_TAGS, Account, JournalEntry, FiscalYear, AccountingSettings } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useAccountingCurrency } from "@/hooks/useCurrency";

interface QuickActionType {
  id: string;
  labelKey: AppTranslationKey;
  icon: React.ElementType;
  debitAcc: string;
  creditAcc: string;
  tag: string;
  descriptionKey: AppTranslationKey;
  groupKey: AppTranslationKey;
  color: string;
}

// ── Quick Action buttons ─────────────────────────────────────────────────────
const QUICK_ACTIONS: { labelKey: AppTranslationKey; icon: React.ElementType; type: QuickActionType }[] = [
  { labelKey: "accounting.journal.dashboard.action.collectFee",      icon: BookOpen,   type: { id: "fee_collection", labelKey: "accounting.journal.dashboard.label.feeCollection", icon: BookOpen,  debitAcc: "a1000", creditAcc: "a4000", tag: "Fees",     descriptionKey: "accounting.journal.dashboard.desc.feeCollection", groupKey: "accounting.journal.dashboard.group.moneyIn",  color: "emerald" } },
  { labelKey: "accounting.journal.dashboard.action.paySalary",       icon: UserCheck,  type: { id: "salary",         labelKey: "accounting.journal.dashboard.label.salaryPayment",          icon: UserCheck, debitAcc: "a5000", creditAcc: "a1010", tag: "Payroll",   descriptionKey: "accounting.journal.dashboard.desc.salaryPayment",         groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red"     } },
  { labelKey: "accounting.journal.dashboard.action.recordDonation",  icon: Heart,      type: { id: "donation",        labelKey: "accounting.journal.dashboard.label.donationReceived",       icon: Heart,     debitAcc: "a1000", creditAcc: "a4100", tag: "Donation", descriptionKey: "accounting.journal.dashboard.desc.donationReceived",          groupKey: "accounting.journal.dashboard.group.moneyIn",  color: "emerald" } },
  { labelKey: "accounting.journal.dashboard.action.payUtility", icon: Zap,        type: { id: "utilities",       labelKey: "accounting.journal.dashboard.label.utilities",               icon: Zap,       debitAcc: "a5200", creditAcc: "a1000", tag: "Utilities", descriptionKey: "accounting.journal.dashboard.desc.utilities",         groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red"     } },
  { labelKey: "accounting.journal.dashboard.action.addExpense",      icon: TrendingUp, type: { id: "other_expense",   labelKey: "accounting.journal.dashboard.label.otherExpense",           icon: TrendingUp,debitAcc: "a5700", creditAcc: "a1000", tag: "Capital",  descriptionKey: "accounting.journal.dashboard.desc.otherExpense",         groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red"     } },
];

// NL parsing: very simple keyword → transaction type mapper
function parseNaturalLanguage(text: string): QuickActionType | null {
  const t = text.toLowerCase();
  if (t.includes("fee") || t.includes("collect"))    return QUICK_ACTIONS[0].type;
  if (t.includes("salary") || t.includes("pay staff"))return QUICK_ACTIONS[1].type;
  if (t.includes("donat"))                            return QUICK_ACTIONS[2].type;
  if (t.includes("electric") || t.includes("util") || t.includes("gas") || t.includes("water")) return QUICK_ACTIONS[3].type;
  if (t.includes("expense") || t.includes("paid") || t.includes("purchase")) return QUICK_ACTIONS[4].type;
  return null;
}


interface JournalEntriesProps {
  entries: JournalEntry[];
  accounts: Account[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
  onChange: (entries: JournalEntry[]) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

// ── Main Component ───────────────────────────────────────────────────────────
/**
 * JournalEntries Component
 *
 * Renders the main dashboard for accounting entries. Supports a simple mode
 * with quick actions and guided templates, as well as an advanced mode for double-entry bookkeeping.
 *
 * @param {JournalEntriesProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function JournalEntries({
  entries,
  accounts,
  settings: _settings,
  fiscalYears,
  onChange,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: JournalEntriesProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      posted: { label: t("accounting.journal.status.posted"), cls: SEMANTIC_BADGE.successStrong },
      draft: { label: t("accounting.journal.status.draft"), cls: SEMANTIC_BADGE.warningStrong },
    }),
    [t],
  );
  const journalSubTabs = useMemo(
    () => [
      { key: "transactions" as const, label: t("accounting.journal.tabs.transactions") },
      { key: "cashbook" as const, label: t("accounting.journal.tabs.cashbook") },
    ],
    [t],
  );
  // Mode: "simple" | "advanced"
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  // Active tab: "transactions" | "cashbook"
  const [tab, setTab]   = useState<"transactions" | "cashbook">("transactions");

  // Simple mode state
  const [simpleModal,   setSimpleModal]   = useState<{ prefillType: QuickActionType | null } | null>(null);
  const [nlInput,       setNlInput]       = useState("");
  const [nlSuggestion,  setNlSuggestion]  = useState<QuickActionType | null>(null);

  // Advanced mode state
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter,    setTagFilter]    = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [showFilters,  setShowFilters]  = useState(false);
  const [modal,        setModal]        = useState<"new" | "edit" | "view" | null>(null);
  const [selected,     setSelected]     = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => entries
    .filter((journalEntry) => statusFilter === "all" || journalEntry.status === statusFilter)
    .filter((journalEntry) => tagFilter === "all" || (journalEntry.tags || []).includes(tagFilter))
    .filter((journalEntry) => !dateFrom || journalEntry.date >= dateFrom)
    .filter((journalEntry) => !dateTo   || journalEntry.date <= dateTo)
    .filter((journalEntry) => !search   || journalEntry.description.toLowerCase().includes(search.toLowerCase()) || journalEntry.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date)),
  [entries, search, statusFilter, tagFilter, dateFrom, dateTo]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const showRef = isColumnVisible ? isColumnVisible("ref") : true;
  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showDescription = isColumnVisible ? isColumnVisible("description") : true;
  const showTags = isColumnVisible ? isColumnVisible("tags") : true;
  const showDebit = isColumnVisible ? isColumnVisible("debit") : true;
  const showCredit = isColumnVisible ? isColumnVisible("credit") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;

  const handleSave = (entry: JournalEntry) => {
    if (entries.find((journalEntry) => journalEntry.id === entry.id)) onChange(entries.map((journalEntry) => journalEntry.id === entry.id ? entry : journalEntry));
    else onChange([...entries, entry]);
    setModal(null); setSelected(null); setSimpleModal(null);
  };

  const handleDelete = (id: string) => {
    const entry = entries.find((journalEntry) => journalEntry.id === id);
    if (entry?.status === "posted") { alert(t("accounting.journal.alerts.cannotDeletePosted")); return; }
    if (confirm(t("accounting.journal.alerts.deleteDraftConfirm"))) onChange(entries.filter((journalEntry) => journalEntry.id !== id));
  };

  const handlePost    = (entry: JournalEntry) => onChange(entries.map((journalEntry) => journalEntry.id === entry.id ? { ...journalEntry, status: "posted" } : journalEntry));
  const handleReverse = (entry: JournalEntry) => {
    if (!confirm(t("accounting.journal.alerts.reverseConfirm", { ref: entry.ref }))) return;
    onChange([...entries, createReversalEntry(entry, entries)]);
  };

  const exportCSV = () => {
    const rows = filtered.map((journalEntry) => {
      const totalDebit = journalEntry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
      const totalCredit = journalEntry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
      return {
        ref: journalEntry.ref,
        date: journalEntry.date,
        description: journalEntry.description,
        tags: (journalEntry.tags || []).join(";"),
        status: journalEntry.status,
        debit: String(totalDebit),
        credit: String(totalCredit),
      };
    });
    runGridCsvExportJob({
      moduleId: "accounting",
      label: t("accounting.journal.exportLabel"),
      filename: "journal_entries.csv",
      columns: [
        { header: t("accounting.columns.journal.ref"), key: "ref" },
        { header: t("accounting.columns.journal.date"), key: "date" },
        { header: t("accounting.columns.journal.description"), key: "description" },
        { header: t("accounting.columns.journal.tags"), key: "tags" },
        { header: t("accounting.columns.journal.status"), key: "status" },
        { header: t("accounting.columns.journal.debit"), key: "debit" },
        { header: t("accounting.columns.journal.credit"), key: "credit" },
      ],
      rows,
    });
  };

  const handleNlSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const type = parseNaturalLanguage(nlInput);
    if (type) {
      setSimpleModal({ prefillType: type });
      setNlInput("");
      setNlSuggestion(null);
    } else {
      setSimpleModal({ prefillType: null });
    }
  };

  const handleNlChange = (inputValue: string) => {
    setNlInput(inputValue);
    setNlSuggestion(inputValue.length > 3 ? parseNaturalLanguage(inputValue) : null);
  };

  const grandDebit  = filtered.reduce((sum, journalEntry) => sum + journalEntry.lines.reduce((lineTotal, journalLine) => lineTotal + journalLine.debit, 0), 0);
  const grandCredit = filtered.reduce((sum, journalEntry) => sum + journalEntry.lines.reduce((lineTotal, journalLine) => lineTotal + journalLine.credit, 0), 0);

  // ── Mode toggle bar ────────────────────────────────────────────────────────
  const ModeToggle = () => (
    <nav aria-label="View Mode" className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/30">
      <Button 
        type="button"
        variant={mode === "simple" ? "default" : "ghost"}
        size="sm"
        aria-pressed={mode === "simple"}
        onClick={() => setMode("simple")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.simple")}
      </Button>
      <Button 
        type="button"
        variant={mode === "advanced" ? "default" : "ghost"}
        size="sm"
        aria-pressed={mode === "advanced"}
        onClick={() => setMode("advanced")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
      >
        <Layers className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.advanced")}
      </Button>
    </nav>
  );

  // ── SIMPLE MODE ────────────────────────────────────────────────────────────
  if (mode === "simple") {
    return (
      <section aria-label="Simple Transactions" className="space-y-5">
        {/* Header row */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground m-0">{t("accounting.journal.dashboard.recordTransaction")}</h2>
            <p className="text-xs text-muted-foreground m-0">{t("accounting.journal.dashboard.subtitleSimple")}</p>
          </div>
          <ModeToggle />
        </header>

        <SubTabBar
          tabs={journalSubTabs}
          value={tab}
          onChange={setTab}
          panelIdPrefix="journal-simple"
        />

        {tab === "cashbook" ? (
          <CashbookView entries={entries} accounts={accounts} />
        ) : (
          <>
            {/* Natural language entry */}
            <article className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <header className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground m-0">{t("accounting.journal.dashboard.whatHappened")}</h3>
                <span className="text-xs text-muted-foreground">{t("accounting.journal.dashboard.typePlainLanguage")}</span>
              </header>
              <form onSubmit={handleNlSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <label htmlFor="nl-input" className="sr-only">Natural Language Transaction Entry</label>
                  <Input id="nl-input" value={nlInput} onChange={(event) => handleNlChange(event.target.value)}
                    placeholder={t("accounting.journal.dashboard.placeholderNl")}
                    className="w-full px-4 py-3" />
                  {nlSuggestion && (
                    <div className="absolute top-full left-0 mt-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg z-10 flex items-center gap-1.5" role="status">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {t("accounting.journal.dashboard.autoDetected", { label: t(nlSuggestion.labelKey) })}
                    </div>
                  )}
                </div>
                <Button type="submit" className="px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap h-auto">
                  {t("accounting.journal.dashboard.record")}
                </Button>
              </form>
            </article>

            {/* Quick action buttons */}
            <section aria-label="Quick Actions">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 m-0">{t("accounting.journal.dashboard.quickActions")}</h3>
              <nav className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <Button key={qa.labelKey} type="button" variant="outline" onClick={() => setSimpleModal({ prefillType: qa.type })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-all shadow-sm h-auto">
                      <Icon className="w-4 h-4 text-primary" aria-hidden="true" /> {t(qa.labelKey)}
                    </Button>
                  );
                })}
                <Button type="button" variant="ghost" onClick={() => setSimpleModal({ prefillType: null })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all h-auto">
                  <Plus className="w-4 h-4" aria-hidden="true" /> {t("accounting.journal.dashboard.otherTransaction")}
                </Button>
              </nav>
            </section>

            {/* Recent transactions list */}
            <section aria-label="Recent Transactions">
              <header className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide m-0">{t("accounting.journal.dashboard.recentTransactions")}</h3>
                <Button type="button" variant="link" size="sm" onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-0 h-auto">
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
                </Button>
              </header>

              {entries.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border" role="status">
                  <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-sm font-semibold text-muted-foreground m-0">{t("accounting.journal.dashboard.noTransactionsYet")}</p>
                  <p className="text-xs text-muted-foreground mt-1 m-0">{t("accounting.journal.dashboard.useQuickActions")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...entries].sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date)).slice(0, 20).map((entry) => {
                    const amount = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
                    const isMoneyIn = (entry.tags || []).some((tag) => ["Fees","Donation","Capital"].includes(tag)) || ["fee_collection","donation","rent_income","other_income"].includes(entry.transaction_type || "");
                    return (
                      <article key={entry.id} className="relative overflow-hidden group/entry flex items-center gap-4 px-5 py-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm hover:bg-muted/20 transition-all duration-300">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMoneyIn ? "bg-success/45 group-hover/entry:bg-success" : "bg-destructive/45 group-hover/entry:bg-destructive"} transition-colors duration-300`} />
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-1 ${isMoneyIn ? "bg-success/15" : "bg-destructive/15"}`} aria-hidden="true">
                          {isMoneyIn ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingUp className="w-4 h-4 text-destructive rotate-180" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate m-0">{entry.description}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">{entry.ref}</span>
                            {(entry.tags || []).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className={`text-sm font-bold font-mono m-0 ${isMoneyIn ? "text-success" : "text-destructive"}`}>
                              {isMoneyIn ? "+" : "−"}{formatCurrency(amount)}
                            </p>
                          </div>
                          <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <SimpleTransactionWizard
              open={simpleModal !== null}
              accounts={accounts}
              entries={entries}
              fiscalYears={fiscalYears}
              prefillType={simpleModal?.prefillType}
              onSave={handleSave}
              onClose={() => setSimpleModal(null)}
            />
      </section>
    );
  }

  // ── ADVANCED MODE ──────────────────────────────────────────────────────────
  return (
    <section aria-label="Advanced Journal Entries" className="space-y-4">
      {/* Mode toggle + header */}
      <nav aria-label="Journal controls" className="flex flex-wrap gap-2 items-center">
        <ModeToggle />
        <div className="flex-1" />
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("accounting.journal.dashboard.searchPlaceholder")}
          className="min-w-[180px]"
        />
        <FormSelect 
          aria-label="Filter by status"
          value={statusFilter} 
          onChange={setStatusFilter}
          options={[
            { value: "all", label: t("accounting.journal.dashboard.allStatus") },
            { value: "posted", label: t("accounting.journal.status.posted") },
            { value: "draft", label: t("accounting.journal.status.draft") }
          ]}
        />
        <Button 
          type="button"
          variant={showFilters ? "secondary" : "outline"}
          aria-pressed={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.filters")}
        </Button>
        <Button 
          type="button"
          variant="outline"
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
        </Button>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        <Button 
          type="button"
          variant="default"
          onClick={() => { setSelected(null); setModal("new"); }}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.newEntry")}
        </Button>
      </nav>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-muted/30">
          <div>
            <label htmlFor="filter-from" className="text-[10px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.fromDate")}</label>
            <DatePicker
              id="filter-from"
              value={dateFrom}
              onChange={setDateFrom}
            />
          </div>
          <div>
            <label htmlFor="filter-to" className="text-[10px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.toDate")}</label>
            <DatePicker
              id="filter-to"
              value={dateTo}
              onChange={setDateTo}
            />
          </div>
          <div>
            <label htmlFor="filter-tag" className="text-[10px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.tag")}</label>
            <FormSelect 
              id="filter-tag" 
              value={tagFilter} 
              onChange={setTagFilter}
              options={[{ value: "all", label: t("accounting.journal.dashboard.allTags") }, ...JOURNAL_TAGS]}
            />
          </div>
          <Button 
            type="button" 
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(""); setDateTo(""); setTagFilter("all"); }}
            className="self-end text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1.5 h-auto"
          >
            {t("accounting.journal.dashboard.clear")}
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-border" role="status">
          {t("accounting.journal.dashboard.noEntriesMatch")}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Journal Entries</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  {showRef && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.ref")}
                    </th>
                  )}
                  {showDate && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.date")}
                    </th>
                  )}
                  {showDescription && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.description")}
                    </th>
                  )}
                  {showTags && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                      {t("accounting.columns.journal.tags")}
                    </th>
                  )}
                  {showDebit && (
                    <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.debit")}
                    </th>
                  )}
                  {showCredit && (
                    <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.credit")}
                    </th>
                  )}
                  {showStatus && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.journal.status")}
                    </th>
                  )}
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("accounting.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((entry) => {
                  const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
                  const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
                  return (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      {showRef && (
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs font-bold text-primary">{entry.ref}</span>
                          {entry.reversed_ref && <p className="text-[10px] text-warning font-semibold m-0">{t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}</p>}
                          {entry.simple_mode && <span className="text-[10px] text-primary/60 font-semibold m-0">{t("accounting.journal.dashboard.simpleMode")}</span>}
                        </td>
                      )}
                      {showDate && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                      )}
                      {showDescription && (
                        <td className="px-3 py-2.5 text-foreground max-w-[200px] truncate">{entry.description}</td>
                      )}
                      {showTags && (
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(entry.tags || []).slice(0, 2).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{tag}</span>
                            ))}
                            {(entry.tags || []).length > 2 && <span className="text-[10px] text-muted-foreground">+{entry.tags.length - 2}</span>}
                          </div>
                        </td>
                      )}
                      {showDebit && (
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-info">
                          {formatCurrency ? formatCurrency(totalDebit) : formatMoney(totalDebit)}
                        </td>
                      )}
                      {showCredit && (
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-success">
                          {formatCurrency ? formatCurrency(totalCredit) : formatMoney(totalCredit)}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-3 py-2.5"><StatusBadge status={entry.status} config={journalStatusConfig} size="sm" /></td>
                      )}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`View entry ${entry.ref}`}
                            onClick={() => { setSelected(entry); setModal("view"); }}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          {entry.status === "draft" && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit entry ${entry.ref}`}
                                onClick={() => { setSelected(entry); setModal("edit"); }}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Post entry ${entry.ref}`}
                                onClick={() => handlePost(entry)}
                                className="h-8 w-8 text-muted-foreground hover:text-success"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete entry ${entry.ref}`}
                                onClick={() => handleDelete(entry.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            </>
                          )}
                          {entry.status === "posted" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Reverse entry ${entry.ref}`}
                              onClick={() => handleReverse(entry)}
                              className="h-8 w-8 text-muted-foreground hover:text-warning"
                            >
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={(showRef ? 1 : 0) + (showDate ? 1 : 0) + (showDescription ? 1 : 0) + (showTags ? 1 : 0) || 1} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                    {filtered.length !== 1 ? t("accounting.journal.dashboard.entriesCount", { count: filtered.length }) : t("accounting.journal.dashboard.entryCount", { count: filtered.length })}
                  </td>
                  {showDebit && (
                    <td className="px-3 py-2 text-right font-mono font-bold text-info text-xs">
                      {formatCurrency ? formatCurrency(grandDebit) : formatMoney(grandDebit)}
                    </td>
                  )}
                  {showCredit && (
                    <td className="px-3 py-2 text-right font-mono font-bold text-success text-xs">
                      {formatCurrency ? formatCurrency(grandCredit) : formatMoney(grandCredit)}
                    </td>
                  )}
                  <td colSpan={(showStatus ? 1 : 0) + 1} className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                    {Math.abs(grandDebit - grandCredit) < 0.01
                      ? <span className="text-success">{t("accounting.journal.dashboard.balanced")}</span>
                      : <span className="text-destructive">{t("accounting.journal.dashboard.difference", { diff: formatCurrency(Math.abs(grandDebit - grandCredit)) })}</span>
                    }
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(modal === "new" || modal === "edit") && (
          <JournalEntryForm
            accounts={accounts}
            entries={entries}
            initial={modal === "edit" ? selected : null}
            fiscalYears={fiscalYears}
            onSave={handleSave}
            onClose={() => { setModal(null); setSelected(null); }}
          />
        )}
        {modal === "view" && selected && (
          <JournalEntryDetail
            entry={selected}
            accounts={accounts}
            onClose={() => { setModal(null); setSelected(null); }}
            onEdit={() => setModal("edit")}
            onReverse={() => { handleReverse(selected); setModal(null); setSelected(null); }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
