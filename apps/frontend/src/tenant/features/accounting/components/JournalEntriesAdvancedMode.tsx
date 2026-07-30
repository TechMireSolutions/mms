import type { ReactNode } from "react";
import { type AppTranslationKey } from "@mms/shared";
import { Download, Filter, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { SubTabBar } from "@/components/ui/SubTabBar";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { JOURNAL_TAGS, type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { JournalEntryDetail } from "@/tenant/features/accounting/components/JournalEntryDetail";
import { JournalEntryForm } from "@/tenant/features/accounting/components/JournalEntryForm";
import { JournalEntriesList } from "@/tenant/features/accounting/components/JournalEntriesList";
import { useTranslation } from "@/hooks/useTranslation";

type JournalMode = "simple" | "advanced";
type JournalModalMode = "new" | "edit" | "view" | null;

interface JournalEntriesVisibleColumns {
  ref: boolean;
  date: boolean;
  description: boolean;
  tags: boolean;
  debit: boolean;
  credit: boolean;
  status: boolean;
}

interface JournalEntriesAdvancedModeProps {
  mode: JournalMode;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  accounts: Account[];
  fiscalYears: FiscalYear[];
  selectedIds: string[];
  allFilteredSelected: boolean;
  visibleColumns: JournalEntriesVisibleColumns;
  journalStatusConfig: Record<string, StatusBadgeConfigItem>;
  grandDebit: number;
  grandCredit: number;
  search: string;
  statusFilter: string;
  tagFilter: string;
  dateFrom: string;
  dateTo: string;
  showFilters: boolean;
  modal: JournalModalMode;
  selected: JournalEntry | null;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  renderEntryActions: (entry: JournalEntry) => ReactNode;
  formatAmount: (amount: number) => string;
  onModeChange: (mode: JournalMode) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onShowFiltersChange: (showFilters: boolean) => void;
  onOpenNew: () => void;
  onBulkAction: () => void;
  onExportCsv: () => void;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onSave: (entry: JournalEntry) => void | Promise<void>;
  onCloseModal: () => void;
  onEditSelected: () => void;
  onReverseSelected: () => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function JournalEntriesAdvancedMode({
  mode,
  modeTabs,
  entries,
  filteredEntries,
  accounts,
  fiscalYears,
  selectedIds,
  allFilteredSelected,
  visibleColumns,
  journalStatusConfig,
  grandDebit,
  grandCredit,
  search,
  statusFilter,
  tagFilter,
  dateFrom,
  dateTo,
  showFilters,
  modal,
  selected,
  canWrite,
  canDelete,
  showDeleted,
  columnCustomizer,
  renderEntryActions,
  formatAmount,
  onModeChange,
  onSearchChange,
  onStatusFilterChange,
  onTagFilterChange,
  onDateFromChange,
  onDateToChange,
  onShowFiltersChange,
  onOpenNew,
  onBulkAction,
  onExportCsv,
  onToggleSelected,
  onToggleAll,
  onSave,
  onCloseModal,
  onEditSelected,
  onReverseSelected,
  getColumnWidth,
  onColumnResize,
}: JournalEntriesAdvancedModeProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("accounting.journal.advancedAria")} className="space-y-4">
      <nav aria-label={t("accounting.journal.controlsAria")} className="flex flex-wrap gap-2 items-center">
        <SubTabBar tabs={modeTabs} value={mode} onChange={onModeChange} panelIdPrefix="journal-mode-advanced" />
        <div className="flex-1" />
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={t("accounting.journal.dashboard.searchPlaceholder")}
          className="min-w-[11.25rem]"
        />
        <FormSelect
          aria-label={t("accounting.journal.filterStatusAria")}
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: "all", label: t("accounting.journal.dashboard.allStatus") },
            { value: "posted", label: t("accounting.journal.status.posted") },
            { value: "draft", label: t("accounting.journal.status.draft") },
          ]}
        />
        <Button
          type="button"
          variant={showFilters ? "secondary" : "outline"}
          aria-pressed={showFilters}
          onClick={() => onShowFiltersChange(!showFilters)}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.filters")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onExportCsv}
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
        {canDelete && selectedIds.length > 0 && (
          <Button
            type="button"
            variant={showDeleted ? "outline" : "destructive"}
            onClick={onBulkAction}
            className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
          >
            {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
            {showDeleted ? t("accounting.trash.restore") : t("common.delete")} ({selectedIds.length})
          </Button>
        )}
        {canWrite && !showDeleted && (
          <Button
            type="button"
            variant="default"
            onClick={onOpenNew}
            className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.newEntry")}
          </Button>
        )}
      </nav>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-muted/30">
          <div>
            <label htmlFor="filter-from" className="text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.fromDate")}</label>
            <DatePicker
              id="filter-from"
              value={dateFrom}
              onChange={onDateFromChange}
            />
          </div>
          <div>
            <label htmlFor="filter-to" className="text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.toDate")}</label>
            <DatePicker
              id="filter-to"
              value={dateTo}
              onChange={onDateToChange}
            />
          </div>
          <div>
            <label htmlFor="filter-tag" className="text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.tag")}</label>
            <FormSelect
              id="filter-tag"
              value={tagFilter}
              onChange={onTagFilterChange}
              options={[
                { value: "all", label: t("accounting.journal.dashboard.allTags") },
                ...JOURNAL_TAGS.map((tag) => ({
                  value: tag,
                  label: t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey),
                })),
              ]}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { onDateFromChange(""); onDateToChange(""); onTagFilterChange("all"); }}
            className="self-end text-xs font-semibold text-muted-foreground hover:text-foreground px-2"
          >
            {t("accounting.journal.dashboard.clear")}
          </Button>
        </div>
      )}

      <JournalEntriesList
        entries={filteredEntries}
        selectedIds={selectedIds}
        canDelete={canDelete}
        allFilteredSelected={allFilteredSelected}
        visibleColumns={visibleColumns}
        journalStatusConfig={journalStatusConfig}
        grandDebit={grandDebit}
        grandCredit={grandCredit}
        formatAmount={formatAmount}
        renderEntryActions={renderEntryActions}
        onToggleSelected={onToggleSelected}
        onToggleAll={onToggleAll}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />

      <AnimatePresence>
        {canWrite && (modal === "new" || modal === "edit") && (
          <JournalEntryForm
            accounts={accounts}
            entries={entries}
            initial={modal === "edit" ? selected : null}
            fiscalYears={fiscalYears}
            onSave={onSave}
            onClose={onCloseModal}
          />
        )}
        {modal === "view" && selected && (
          <JournalEntryDetail
            entry={selected}
            accounts={accounts}
            onClose={onCloseModal}
            onEdit={canWrite ? onEditSelected : undefined}
            onReverse={canWrite ? onReverseSelected : undefined}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
