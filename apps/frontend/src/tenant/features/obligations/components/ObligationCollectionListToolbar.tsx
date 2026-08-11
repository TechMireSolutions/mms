import type React from "react";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { ObligationType } from "@/lib/data/obligationsData";
import { ObligationsFiltersMenuButton } from "@/tenant/features/obligations/components/ObligationsFiltersMenuButton";

export const OBLIGATIONS_WORK_SEARCH_INPUT_ID = "obligations-work-search";

interface ObligationCollectionListToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  typeFilter: string;
  obligationTypes: ObligationType[];
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
}

export function ObligationCollectionListToolbar({
  viewMode,
  onViewModeChange,
  search,
  typeFilter,
  obligationTypes,
  columnCustomizer,
  onSearchChange,
  onTypeFilterChange,
}: ObligationCollectionListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const activeFilterCount = typeFilter !== "all" ? 1 : 0;
  const selectedType = obligationTypes.find((item) => item.id === typeFilter);

  return (
    <>
      <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={OBLIGATIONS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("obligations.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <ObligationsFiltersMenuButton
            typeFilter={typeFilter}
            obligationTypes={obligationTypes}
            activeFilterCount={activeFilterCount}
            onChangeType={onTypeFilterChange}
            onClearFilters={() => onTypeFilterChange("all")}
          />

          {activeFilterCount > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={() => onTypeFilterChange("all")}
              label={t("obligations.clearFilters")}
            />
          ) : null}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
        </div>
      </div>

      <FilterChips
        chips={
          activeFilterCount > 0
            ? [
                {
                  key: `type:${typeFilter}`,
                  label: selectedType?.name ?? t("obligations.filter.allTypes"),
                  onRemove: () => onTypeFilterChange("all"),
                },
              ]
            : []
        }
        onClearAll={() => onTypeFilterChange("all")}
      />
    </>
  );
}
