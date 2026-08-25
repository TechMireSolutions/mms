import { FilterChips } from "@/components/ui/FilterChips";
import { type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import type { ObligationType } from "@/lib/data/obligationsData";
import { ObligationsFiltersMenuButton } from "@/tenant/features/obligations/components/ObligationsFiltersMenuButton";

export const OBLIGATIONS_WORK_SEARCH_INPUT_ID = "obligations-work-search";

interface ObligationsListFiltersProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  typeFilter: string;
  obligationTypes: ObligationType[];
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
}

export function ObligationsListFilters({
  viewMode,
  onViewModeChange,
  search,
  typeFilter,
  obligationTypes,
  columnCustomizer,
  onSearchChange,
  onTypeFilterChange,
}: ObligationsListFiltersProps): React.JSX.Element {
  const { t } = useTranslation();
  const activeFilterCount = typeFilter !== "all" ? 1 : 0;
  const selectedType = obligationTypes.find((item) => item.id === typeFilter);

  return (
    <>
      <ModuleWorkToolbar
        regionLabel={t("obligations.collections")}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("obligations.searchPlaceholder")}
        searchId={OBLIGATIONS_WORK_SEARCH_INPUT_ID}
        hasActiveFilters={activeFilterCount > 0}
        onClearFilters={() => onTypeFilterChange("all")}
        clearFiltersLabel={t("obligations.clearFilters")}
        filterButton={
          <ObligationsFiltersMenuButton
            typeFilter={typeFilter}
            obligationTypes={obligationTypes}
            activeFilterCount={activeFilterCount}
            onChangeType={onTypeFilterChange}
            onClearFilters={() => onTypeFilterChange("all")}
          />
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
      />

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
