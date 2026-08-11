import { Download, Plus } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { DateRangeFilterBar } from "@/components/ui/DateRangeFilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { AccountingFiltersMenuButton } from "@/tenant/features/accounting/components/AccountingFiltersMenuButton";
import { getJournalTagLabel } from "@/tenant/features/accounting/components/journalEntriesListShared";

export const ACCOUNTING_WORK_SEARCH_INPUT_ID = "accounting-work-search";

type JournalMode = "simple" | "advanced";

interface JournalEntriesAdvancedToolbarProps {
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

export function JournalEntriesAdvancedToolbar({
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
}: JournalEntriesAdvancedToolbarProps) {
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
      <div className={cn(WORK_SURFACE, "flex flex-col gap-3 p-3")}>
        <SubTabBar tabs={modeTabs} value={mode} onChange={onModeChange} panelIdPrefix="journal-mode-advanced" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchBar
              id={ACCOUNTING_WORK_SEARCH_INPUT_ID}
              value={search}
              onChange={onSearchChange}
              placeholder={t("accounting.journal.dashboard.searchPlaceholder")}
              className="w-full min-w-0"
            />
            <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
              <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                /
              </kbd>
            </div>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
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
            {activeFilterCount > 0 ? (
              <ModuleClearFiltersButton
                onClearFilters={() => {
                  onStatusFilterChange("all");
                  onTagFilterChange("all");
                }}
                label={t("accounting.clearFilters")}
              />
            ) : null}
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
            <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            {columnCustomizer && (
              <ModuleColumnCustomizer
                columnRegistry={columnCustomizer.columnRegistry}
                updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
                labels={columnCustomizer.labels}
              />
            )}
            {canWrite && !showDeleted && (
              <Button
                type="button"
                variant="default"
                onClick={onOpenNew}
                className="flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.newEntry")}
              </Button>
            )}
          </div>
        </div>
      </div>
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
