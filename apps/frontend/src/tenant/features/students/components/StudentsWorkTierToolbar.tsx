import { useMemo } from "react";
import type { StudentsQuickFilter } from "@mms/shared";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { StudentsFilterMenuButton } from "@/tenant/features/students/components/StudentsFilterMenuButton";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import {
  getStudentVisibleWorkColumns,
  toStudentListSortField,
} from "@/tenant/features/students/components/studentListVisibleColumns";
import { STUDENTS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/students/hooks/useStudentsKeyboardShortcuts";

interface StudentsWorkTierToolbarProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  quickFilter: StudentsQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  viewingDeleted: boolean;
  canDelete: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  viewMode: WorkDirectoryViewMode;
  sortField: StudentListSortField | null;
  sortDir: "asc" | "desc";
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onSortChange: (field: StudentListSortField) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  shownCount?: number;
}

export function StudentsWorkTierToolbar({
  studentSearch,
  studentFilterStatus,
  studentFilterGender,
  quickFilter,
  onQuickFilterChange,
  studentStatusOptions,
  genderFilters,
  viewingDeleted,
  canDelete,
  hasActiveFilters,
  activeFilterCount,
  columnLayout,
  viewMode,
  sortField,
  onViewModeChange,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onSortChange,
  onToggleDeleted,
  onClearFilters,
  shownCount,
}: StudentsWorkTierToolbarProps) {
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () =>
      getStudentVisibleWorkColumns(columnLayout.columnRegistry, columnLayout.isColumnVisible)
        .map((col) => {
          const field = toStudentListSortField(col.key);
          return field ? { field, label: col.label } : null;
        })
        .filter((option): option is { field: StudentListSortField; label: string } => option !== null),
    [columnLayout],
  );

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">
        {shownCount != null ? t("students.shownCount", { count: shownCount }) : ""}
      </div>

      <div className={`flex flex-col sm:flex-row gap-3 ${WORK_SURFACE} p-3`}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={STUDENTS_WORK_SEARCH_INPUT_ID}
            value={studentSearch}
            onChange={onSearchChange}
            placeholder={t("students.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <StudentsFilterMenuButton
            studentFilterStatus={studentFilterStatus}
            studentFilterGender={studentFilterGender}
            quickFilter={quickFilter}
            onQuickFilterChange={onQuickFilterChange}
            studentStatusOptions={studentStatusOptions}
            genderFilters={genderFilters}
            activeFilterCount={activeFilterCount}
            sortField={sortField}
            sortOptions={sortOptions}
            onToggleStatus={onToggleStatus}
            onGenderChange={onGenderChange}
            onSortChange={onSortChange}
            onClearFilters={onClearFilters}
          />

          {hasActiveFilters ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={t("students.clearFilters")}
            />
          ) : null}

          {canDelete && (
            <ModuleTrashToggle
              showDeleted={viewingDeleted}
              onToggle={onToggleDeleted}
              showActiveLabel={t("students.showActive")}
              showDeletedLabel={t("students.showDeleted")}
            />
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          <ModuleColumnCustomizer
            columnRegistry={columnLayout.columnRegistry}
            updateUserColumnLayout={columnLayout.updateUserColumnLayout}
            onResetLayout={columnLayout.resetColumnLayout}
            labels={columnLayout.customizerLabels}
          />
        </div>
      </div>
    </>
  );
}
