import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { BulkSelectionRestoreAction } from "@/components/ui/BulkSelectionActions";
import { Button } from "@/components/ui/button";
import { type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { JournalEntryDetail } from "@/tenant/features/accounting/components/JournalEntryDetail";
import { JournalEntryForm } from "@/tenant/features/accounting/components/JournalEntryForm";
import { JournalEntriesList } from "@/tenant/features/accounting/components/JournalEntriesList";
import { JournalEntriesAdvancedToolbar, JournalEntriesAdvancedFilters } from "@/tenant/features/accounting/components/JournalEntriesAdvancedToolbar";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

type JournalMode = "simple" | "advanced";
type JournalModalMode = "new" | "edit" | "view" | null;

interface JournalEntriesAdvancedModeProps {
  mode: JournalMode;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  accounts: Account[];
  fiscalYears: FiscalYear[];
  selectedIds: string[];
  allFilteredSelected: boolean;
  isColumnVisible: (key: string) => boolean;
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

export function JournalEntriesAdvancedMode(props: JournalEntriesAdvancedModeProps) {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  return (
    <section aria-label={t("accounting.journal.advancedAria")} className="space-y-4">
      {props.canDelete && (
        <BulkSelectionBar
          placement="floating"
          selectedCount={props.selectedIds.length}
          countLabel={t("accounting.trash.selected", { count: props.selectedIds.length })}
        >
          {props.showDeleted ? (
            <BulkSelectionRestoreAction
              label={t("accounting.trash.restore")}
              onClick={props.onBulkAction}
            />
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={props.onBulkAction}
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.delete")}
            </Button>
          )}
        </BulkSelectionBar>
      )}

      <JournalEntriesAdvancedToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        mode={props.mode}
        modeTabs={props.modeTabs}
        search={props.search}
        statusFilter={props.statusFilter}
        showFilters={props.showFilters}
        canWrite={props.canWrite}
        showDeleted={props.showDeleted}
        columnCustomizer={props.columnCustomizer}
        onModeChange={props.onModeChange}
        onSearchChange={props.onSearchChange}
        onStatusFilterChange={props.onStatusFilterChange}
        onShowFiltersChange={props.onShowFiltersChange}
        onOpenNew={props.onOpenNew}
        onExportCsv={props.onExportCsv}
      />

      {props.showFilters && (
        <JournalEntriesAdvancedFilters
          dateFrom={props.dateFrom}
          dateTo={props.dateTo}
          tagFilter={props.tagFilter}
          onDateFromChange={props.onDateFromChange}
          onDateToChange={props.onDateToChange}
          onTagFilterChange={props.onTagFilterChange}
        />
      )}

      <JournalEntriesList
        viewMode={viewMode}
        entries={props.filteredEntries}
        selectedIds={props.selectedIds}
        canDelete={props.canDelete}
        allFilteredSelected={props.allFilteredSelected}
        isColumnVisible={props.isColumnVisible}
        journalStatusConfig={props.journalStatusConfig}
        grandDebit={props.grandDebit}
        grandCredit={props.grandCredit}
        formatAmount={props.formatAmount}
        renderEntryActions={props.renderEntryActions}
        onToggleSelected={props.onToggleSelected}
        onToggleAll={props.onToggleAll}
        getColumnWidth={props.getColumnWidth}
        onColumnResize={props.onColumnResize}
      />

      <AnimatePresence>
        {props.canWrite && (props.modal === "new" || props.modal === "edit") && (
          <JournalEntryForm
            accounts={props.accounts}
            entries={props.entries}
            initial={props.modal === "edit" ? props.selected : null}
            fiscalYears={props.fiscalYears}
            onSave={props.onSave}
            onClose={props.onCloseModal}
          />
        )}
        {props.modal === "view" && props.selected && (
          <JournalEntryDetail
            entry={props.selected}
            accounts={props.accounts}
            onClose={props.onCloseModal}
            onEdit={props.canWrite ? props.onEditSelected : undefined}
            onReverse={props.canWrite ? props.onReverseSelected : undefined}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
