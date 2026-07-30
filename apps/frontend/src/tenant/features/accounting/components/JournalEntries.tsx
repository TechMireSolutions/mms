import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatMoney } from "@mms/shared";
import { createReversalEntry, type Account, type AccountingSettings, type FiscalYear, type JournalEntry } from '@/lib/data/accountingData';
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { JournalEntryActions } from "@/tenant/features/accounting/components/JournalEntryActions";
import { JournalEntriesAdvancedMode } from "@/tenant/features/accounting/components/JournalEntriesAdvancedMode";
import { JournalEntriesSimpleMode } from "@/tenant/features/accounting/components/JournalEntriesSimpleMode";
import { parseNaturalLanguage, type QuickActionType } from "@/tenant/features/accounting/components/journalEntriesQuickActions";


interface JournalEntriesProps {
  entries: JournalEntry[];
  accounts: Account[];
  settings: AccountingSettings;
  fiscalYears: FiscalYear[];
  onChange: (entries: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
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
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
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
  const modeTabs = useMemo(
    () => [
      { key: "simple" as const, label: t("accounting.journal.dashboard.simple") },
      { key: "advanced" as const, label: t("accounting.journal.dashboard.advanced") },
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
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);

  useEffect(() => {
    if (showDeleted) setMode("advanced");
  }, [showDeleted]);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) {
      setMode("advanced");
      setModal("new");
      setSelected(null);
    }
  }, [createRequestKey, canWrite, showDeleted]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

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

  const handleSave = async (entry: JournalEntry) => {
    await onChange((prev) => {
      if (prev.find((journalEntry) => journalEntry.id === entry.id)) {
        return prev.map((journalEntry) => journalEntry.id === entry.id ? entry : journalEntry);
      }
      return [...prev, entry];
    });
    setModal(null); setSelected(null); setSimpleModal(null);
  };

  const handleDelete = async (id: string) => {
    const entry = entries.find((journalEntry) => journalEntry.id === id);
    if (entry?.status === "posted" && !showDeleted) {
      alert(t("accounting.journal.alerts.cannotDeletePosted"));
      return;
    }
    if (showDeleted) {
      if (!confirm(t("accounting.trash.bulkRestoreConfirm", { count: 1 }))) return;
      await onRestore?.(id);
      return;
    }
    if (!confirm(t("accounting.trash.deleteEntryConfirm"))) return;
    await onDelete?.(id);
  };

  const handlePost = async (entry: JournalEntry) => {
    await onChange((prev) => prev.map((journalEntry) => journalEntry.id === entry.id ? { ...journalEntry, status: "posted" } : journalEntry));
  };

  const handleReverse = async (entry: JournalEntry) => {
    if (!confirm(t("accounting.journal.alerts.reverseConfirm", { ref: entry.ref }))) return;
    await onChange((prev) => [...prev, createReversalEntry(entry, prev)]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((entry) => selectedIds.includes(entry.id));

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("accounting.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("accounting.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
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

  const handleNlSubmit = (event: FormEvent<HTMLFormElement>) => {
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

  const renderEntryActions = (entry: JournalEntry) => (
    <JournalEntryActions
      entry={entry}
      canWrite={canWrite}
      canDelete={canDelete}
      showDeleted={showDeleted}
      onView={(journalEntry) => { setSelected(journalEntry); setModal("view"); }}
      onEdit={(journalEntry) => { setSelected(journalEntry); setModal("edit"); }}
      onPost={(journalEntry) => { void handlePost(journalEntry); }}
      onDelete={(id) => { void handleDelete(id); }}
      onReverse={(journalEntry) => { void handleReverse(journalEntry); }}
    />
  );

  // ── SIMPLE MODE ────────────────────────────────────────────────────────────
  if (mode === "simple") {
    return (
      <JournalEntriesSimpleMode
        mode={mode}
        tab={tab}
        modeTabs={modeTabs}
        journalSubTabs={journalSubTabs}
        entries={entries}
        accounts={accounts}
        fiscalYears={fiscalYears}
        canWrite={canWrite}
        simpleModal={simpleModal}
        nlInput={nlInput}
        nlSuggestion={nlSuggestion}
        onModeChange={setMode}
        onTabChange={setTab}
        onNlSubmit={handleNlSubmit}
        onNlChange={handleNlChange}
        onOpenPrefill={(prefillType) => setSimpleModal({ prefillType })}
        onExportCsv={exportCSV}
        onSave={handleSave}
        onCloseSimpleModal={() => setSimpleModal(null)}
      />
    );
  }

  // ── ADVANCED MODE ──────────────────────────────────────────────────────────
  return (
    <JournalEntriesAdvancedMode
      mode={mode}
      modeTabs={modeTabs}
      entries={entries}
      filteredEntries={filtered}
      accounts={accounts}
      fiscalYears={fiscalYears}
      selectedIds={selectedIds}
      allFilteredSelected={allFilteredSelected}
      visibleColumns={{
        ref: showRef,
        date: showDate,
        description: showDescription,
        tags: showTags,
        debit: showDebit,
        credit: showCredit,
        status: showStatus,
      }}
      journalStatusConfig={journalStatusConfig}
      grandDebit={grandDebit}
      grandCredit={grandCredit}
      search={search}
      statusFilter={statusFilter}
      tagFilter={tagFilter}
      dateFrom={dateFrom}
      dateTo={dateTo}
      showFilters={showFilters}
      modal={modal}
      selected={selected}
      canWrite={canWrite}
      canDelete={canDelete}
      showDeleted={showDeleted}
      columnCustomizer={columnCustomizer}
      renderEntryActions={renderEntryActions}
      formatAmount={(amount) => formatCurrency ? formatCurrency(amount) : formatMoney(amount)}
      onModeChange={setMode}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      onTagFilterChange={setTagFilter}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
      onShowFiltersChange={setShowFilters}
      onOpenNew={() => { setSelected(null); setModal("new"); }}
      onBulkAction={() => { void handleBulkAction(); }}
      onExportCsv={exportCSV}
      onToggleSelected={toggleSelected}
      onToggleAll={(checked) => {
        if (checked) setSelectedIds(filtered.map((entry) => entry.id));
        else setSelectedIds([]);
      }}
      onSave={handleSave}
      onCloseModal={() => { setModal(null); setSelected(null); }}
      onEditSelected={() => setModal("edit")}
      onReverseSelected={() => {
        if (!selected) return;
        void handleReverse(selected);
        setModal(null);
        setSelected(null);
      }}
      getColumnWidth={getColumnWidth}
      onColumnResize={onColumnResize}
    />
  );
}
