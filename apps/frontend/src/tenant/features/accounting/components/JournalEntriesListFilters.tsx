import { Download, Plus } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { DateRangeFilterBar } from "@/components/ui/DateRangeFilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { AccountingFiltersMenuButton } from "@/tenant/features/accounting/components/AccountingFiltersMenuButton";
import { getJournalTagLabel } from "@/tenant/features/accounting/components/journalEntriesListShared";

export const ACCOUNTING_WORK_SEARCH_INPUT_ID = "accounting-work-search";

type JournalMode = "simple" | "advanced";

interface JournalEntriesListFiltersProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  mode: JournalMode;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  search: string;
  statusFilter: string;
  tagFilter: string;
  showFilters: boolean;
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onModeChange: (mode: JournalMode) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onShowFiltersChange: (showFilters: boolean) => void;
  onOpenNew: () => void;
  onExportCsv: () => void;
}

export function JournalEntriesListFilters({
  viewMode,
  onViewModeChange,
  mode,
  modeTabs,
  search,
  statusFilter,
  tagFilter,
  showFilters,
  canWrite,
  showDeleted,
  columnCustomizer,
  onModeChange,
  onSearchChange,
  onStatusFilterChange,
  onTagFilterChange,
  onShowFiltersChange,
  onOpenNew,
  onExportCsv,
}: JournalEntriesListFiltersProps) {
  const { t } = useTranslation();
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0);
  const chips = [
    ...(statusFilter !== "all"
      ? [{
          key: `status:${statusFilter}`,
          label: t(`accounting.journal.status.${statusFilter}` as AppTranslationKey),
          onRemove: () => onStatusFilterChange("all"),
        }]
      : []),
    ...(tagFilter !== "all"
      ? [{
          key: `tag:${tagFilter}`,
          label: getJournalTagLabel(tagFilter, t),
          onRemove: () => onTagFilterChange("all"),
        }]
      : []),
  ];

  return (
    <>
      <SubTabBar tabs={modeTabs} value={mode} onChange={onModeChange} panelIdPrefix="journal-mode-advanced" />
      <ModuleWorkToolbar
        regionLabel={t("nav.accounting")}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("accounting.journal.dashboard.searchPlaceholder")}
        searchId={ACCOUNTING_WORK_SEARCH_INPUT_ID}
        hasActiveFilters={activeFilterCount > 0}
        onClearFilters={() => {
          onStatusFilterChange("all");
          onTagFilterChange("all");
        }}
        clearFiltersLabel={t("accounting.clearFilters")}
        filterButton={
          <AccountingFiltersMenuButton
            statusFilter={statusFilter}
            tagFilter={tagFilter}
            activeFilterCount={activeFilterCount}
            onChangeStatus={onStatusFilterChange}
            onChangeTag={onTagFilterChange}
            onClearFilters={() => {
              onStatusFilterChange("all");
              onTagFilterChange("all");
            }}
          />
        }
        primaryAction={
          canWrite && !showDeleted ? (
            <Button
              type="button"
              variant="default"
              onClick={onOpenNew}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.newEntry")}
            </Button>
          ) : undefined
        }
        viewModeToggle={{
          viewMode,
          onViewModeChange,
        }}
        columnCustomizer={columnCustomizer ? {
          registry: columnCustomizer.columnRegistry,
          onUpdate: columnCustomizer.updateUserColumnLayout,
          onReset: columnCustomizer.onResetLayout,
          labels: columnCustomizer.labels,
        } : undefined}
      >
        <Button
          type="button"
          variant={showFilters ? "secondary" : "outline"}
          aria-pressed={showFilters}
          onClick={() => onShowFiltersChange(!showFilters)}
          className="flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          {t("accounting.journal.dashboard.filters")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onExportCsv}
          className="flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
        </Button>
      </ModuleWorkToolbar>
      <FilterChips chips={chips} onClearAll={() => {
        onStatusFilterChange("all");
        onTagFilterChange("all");
      }} />
    </>
  );
}

interface JournalEntriesAdvancedFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export function JournalEntriesAdvancedFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
}: JournalEntriesAdvancedFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(WORK_SURFACE, "flex flex-wrap items-end gap-3 p-3")}>
      <DateRangeFilterBar
        idPrefix="filter"
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        fromLabel={t("accounting.journal.dashboard.fromDate")}
        toLabel={t("accounting.journal.dashboard.toDate")}
        pickerClassName="w-full min-w-0 sm:w-40"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2"
      >
        {t("accounting.journal.dashboard.clear")}
      </Button>
    </div>
  );
}
