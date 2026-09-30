import { useMemo } from "react";
import type {
  FacultySortField,
  FacultyQuickFilter,
  ModuleColumnRegistryEntry,
} from "@mms/shared";
import type { ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { WorkTaskToolbar } from "@/components/common/work";
import { FACULTY_WORK_SEARCH_INPUT_ID } from "@/tenant/features/faculty/hooks/useFacultyKeyboardShortcuts";
import { FacultyFiltersMenuButton } from "@/tenant/features/faculty/components/FacultyFiltersMenuButton";
import {
  getFacultyVisibleWorkColumns,
  toFacultyListSortField,
} from "@/tenant/features/faculty/components/facultyListVisibleColumns";

export interface FacultyListFiltersProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: FacultyQuickFilter;
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
  sortField: FacultySortField;
  onSortChange: (field: FacultySortField) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  filterChips?: React.ReactNode;
}

export function FacultyListFilters({
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
  filterChips,
}: FacultyListFiltersProps): React.JSX.Element {
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () =>
      getFacultyVisibleWorkColumns(columnRegistry, isColumnVisible)
        .map((col) => {
          const field = toFacultyListSortField(col.key);
          return field ? { field, label: col.label } : null;
        })
        .filter((option): option is { field: FacultySortField; label: string } => option !== null),
    [columnRegistry, isColumnVisible],
  );

  return (
    <WorkTaskToolbar
      shownCountLabel={shownCount != null ? t("faculty.shownCount", { count: shownCount }) : undefined}
      regionLabel={t("faculty.filters")}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t("faculty.searchPlaceholder")}
      searchId={FACULTY_WORK_SEARCH_INPUT_ID}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      clearFiltersLabel={t("faculty.clearFilters")}
      filterChips={filterChips}
      filterButton={
        <FacultyFiltersMenuButton
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
      }
      trashToggle={canDelete ? {
        canViewDeleted: canDelete,
        viewingDeleted: showDeleted,
        onToggle: onToggleDeleted,
        activeLabel: t("faculty.showActive"),
        deletedLabel: t("faculty.showDeleted"),
      } : undefined}
      viewModeToggle={{
        viewMode,
        onViewModeChange,
      }}
      columnCustomizer={{
        registry: columnRegistry,
        onUpdate: updateUserColumnLayout,
        onReset: onResetLayout,
        labels: customizerLabels,
      }}
    />
  );
}


