import { useMemo } from "react";
import type { ModuleColumnRegistryEntry, TeacherSortField, TeachersQuickFilter } from "@mms/shared";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TEACHERS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/teachers/hooks/useTeachersKeyboardShortcuts";
import { TeachersFilterMenuButton } from "@/tenant/features/teachers/components/TeachersFilterMenuButton";
import {
  getTeacherVisibleWorkColumns,
  toTeacherListSortField,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";

interface TeachersWorkTierToolbarProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: TeachersQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  genderFilters: string[];
  activeFilterCount: number;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canDelete: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  shownCount?: number;
  columnRegistry: ModuleColumnRegistryEntry[];
  isColumnVisible: (key: string) => boolean;
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  onResetLayout: () => void;
  customizerLabels: ModuleColumnCustomizerLabels;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  sortField: TeacherSortField;
  onSortChange: (field: TeacherSortField) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
}

export function TeachersWorkTierToolbar({
  search,
  filterStatus,
  filterSpecialization,
  filterGender,
  quickFilter,
  onQuickFilterChange,
  genderFilters,
  activeFilterCount,
  statusOptions,
  specializationOptions,
  showDeleted,
  canDelete,
  hasActiveFilters,
  onClearFilters,
  shownCount,
  columnRegistry,
  isColumnVisible,
  updateUserColumnLayout,
  onResetLayout,
  customizerLabels,
  viewMode,
  onViewModeChange,
  sortField,
  onSortChange,
  onSearchChange,
  onToggleStatus,
  onSpecializationChange,
  onGenderChange,
  onToggleDeleted,
}: TeachersWorkTierToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () =>
      getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible)
        .map((col) => {
          const field = toTeacherListSortField(col.key);
          return field ? { field, label: col.label } : null;
        })
        .filter((option): option is { field: TeacherSortField; label: string } => option !== null),
    [columnRegistry, isColumnVisible],
  );

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">
        {shownCount != null ? t("teachers.shownCount", { count: shownCount }) : ""}
      </div>

      <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={TEACHERS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("teachers.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <TeachersFilterMenuButton
            filterStatus={filterStatus}
            filterSpecialization={filterSpecialization}
            filterGender={filterGender}
            quickFilter={quickFilter}
            onQuickFilterChange={onQuickFilterChange}
            genderFilters={genderFilters}
            activeFilterCount={activeFilterCount}
            statusOptions={statusOptions}
            specializationOptions={specializationOptions}
            sortField={sortField}
            sortOptions={sortOptions}
            onToggleStatus={onToggleStatus}
            onSpecializationChange={onSpecializationChange}
            onGenderChange={onGenderChange}
            onSortChange={onSortChange}
            onClearFilters={onClearFilters}
          />

          {hasActiveFilters ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={t("teachers.clearFilters")}
            />
          ) : null}

          {canDelete && (
            <ModuleTrashToggle
              showDeleted={showDeleted}
              onToggle={onToggleDeleted}
              showActiveLabel={t("teachers.showActive")}
              showDeletedLabel={t("teachers.showDeleted")}
            />
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          <ModuleColumnCustomizer
            columnRegistry={columnRegistry}
            updateUserColumnLayout={updateUserColumnLayout}
            onResetLayout={onResetLayout}
            labels={customizerLabels}
          />
        </div>
      </div>
    </>
  );
}
