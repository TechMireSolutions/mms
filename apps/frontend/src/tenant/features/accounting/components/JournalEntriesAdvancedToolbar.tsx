import { type AppTranslationKey } from "@mms/shared";
import { Download, Filter, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { JOURNAL_TAGS } from "@/lib/data/accountingData";
import { useTranslation } from "@/hooks/useTranslation";

type JournalMode = "simple" | "advanced";

interface JournalEntriesAdvancedToolbarProps {
  mode: JournalMode;
  modeTabs: Array<{ key: JournalMode; label: string }>;
  search: string;
  statusFilter: string;
  showFilters: boolean;
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onModeChange: (mode: JournalMode) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onShowFiltersChange: (showFilters: boolean) => void;
  onOpenNew: () => void;
  onBulkAction: () => void;
  onExportCsv: () => void;
}

export function JournalEntriesAdvancedToolbar({
  mode,
  modeTabs,
  search,
  statusFilter,
  showFilters,
  selectedIds,
  canWrite,
  canDelete,
  showDeleted,
  columnCustomizer,
  onModeChange,
  onSearchChange,
  onStatusFilterChange,
  onShowFiltersChange,
  onOpenNew,
  onBulkAction,
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
      <div>
        <label htmlFor="filter-from" className="text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.fromDate")}</label>
        <DatePicker id="filter-from" value={dateFrom} onChange={onDateFromChange} />
      </div>
      <div>
        <label htmlFor="filter-to" className="text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.dashboard.toDate")}</label>
        <DatePicker id="filter-to" value={dateTo} onChange={onDateToChange} />
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
  );
}
