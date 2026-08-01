import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import type { ObligationType } from "@/lib/data/obligationsData";
import { RotateCcw, Search, Trash2 } from "lucide-react";

interface ObligationCollectionListToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  typeFilter: string;
  obligationTypes: ObligationType[];
  selectedCount: number;
  canDelete: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onToggleShowDeleted?: () => void;
  onBulkAction: () => void;
}

export function ObligationCollectionListToolbar({
  search,
  typeFilter,
  obligationTypes,
  selectedCount,
  canDelete,
  showDeleted,
  columnCustomizer,
  onSearchChange,
  onTypeFilterChange,
  onToggleShowDeleted,
  onBulkAction,
  viewMode,
  onViewModeChange,
}: ObligationCollectionListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const selectOptions = [
    { value: "all", label: t("obligations.filter.allTypes") },
    ...obligationTypes.map((item) => ({ value: item.id, label: item.name })),
  ];

  return (
    <section aria-label={t("obligations.filter.label")} className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[11.25rem]">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label={t("obligations.searchPlaceholder")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("obligations.searchPlaceholder")}
          className="w-full ps-9 pe-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="min-w-[9.375rem]">
        <FormSelect
          aria-label={t("obligations.filter.type")}
          value={typeFilter}
          onChange={onTypeFilterChange}
          options={selectOptions}
          className="text-sm rounded-xl border border-border bg-background"
        />
      </div>
      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      {columnCustomizer && (
        <ModuleColumnCustomizer
          columnRegistry={columnCustomizer.columnRegistry}
          updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
          labels={columnCustomizer.labels}
        />
      )}
      {canDelete && onToggleShowDeleted && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={onToggleShowDeleted}
          showActiveLabel={t("obligations.trash.showActive")}
          showDeletedLabel={t("obligations.trash.showDeleted")}
        />
      )}
      {canDelete && selectedCount > 0 && (
        <Button
          type="button"
          variant={showDeleted ? "outline" : "destructive"}
          onClick={onBulkAction}
          className="gap-1.5"
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
          {showDeleted ? t("obligations.trash.restore") : t("common.delete")} ({selectedCount})
        </Button>
      )}
    </section>
  );
}
