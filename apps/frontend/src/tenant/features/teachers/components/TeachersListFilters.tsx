import { useMemo } from "react";
import type { ModuleColumnRegistryEntry, TeacherSortField, TeachersQuickFilter } from "@mms/shared";
import type { ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import { TEACHERS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/teachers/hooks/useTeachersKeyboardShortcuts";
import { TeachersFiltersMenuButton } from "@/tenant/features/teachers/components/TeachersFiltersMenuButton";
import {
  getTeacherVisibleWorkColumns,
  toTeacherListSortField,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";

interface TeachersListFiltersProps {
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

export function TeachersListFilters({
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
}: TeachersListFiltersProps): React.JSX.Element {
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
    <ModuleWorkToolbar
      shownCountLabel={shownCount != null ? t("teachers.shownCount", { count: shownCount }) : undefined}
      regionLabel={t("teachers.filters")}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t("teachers.searchPlaceholder")}
      searchId={TEACHERS_WORK_SEARCH_INPUT_ID}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      clearFiltersLabel={t("teachers.clearFilters")}
      filterButton={
        <TeachersFiltersMenuButton
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
        activeLabel: t("teachers.showActive"),
        deletedLabel: t("teachers.showDeleted"),
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
