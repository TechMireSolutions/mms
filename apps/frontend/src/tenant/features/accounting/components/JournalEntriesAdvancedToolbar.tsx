import { type AppTranslationKey } from "@mms/shared";
import { Download, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilterBar } from "@/components/ui/DateRangeFilterBar";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { JOURNAL_TAGS } from "@/lib/data/accountingData";
import { useTranslation } from "@/hooks/useTranslation";

type JournalMode = "simple" | "advanced";

interface JournalEntriesAdvancedToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  mode: JournalMode;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  search: string;
  statusFilter: string;
  showFilters: boolean;
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onModeChange: (mode: JournalMode) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
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
  showFilters,
  canWrite,
  showDeleted,
  columnCustomizer,
  onModeChange,
  onSearchChange,
  onStatusFilterChange,
  onShowFiltersChange,
  onOpenNew,
  onExportCsv,
}: JournalEntriesAdvancedToolbarProps) {
  const { t } = useTranslation();

  return (
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
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.newEntry")}
        </Button>
      )}
    </nav>
  );
}

interface JournalEntriesAdvancedFiltersProps {
  dateFrom: string;
  dateTo: string;
  tagFilter: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
}

export function JournalEntriesAdvancedFilters({
  dateFrom,
  dateTo,
  tagFilter,
  onDateFromChange,
  onDateToChange,
  onTagFilterChange,
}: JournalEntriesAdvancedFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-muted/30">
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
  );
}
