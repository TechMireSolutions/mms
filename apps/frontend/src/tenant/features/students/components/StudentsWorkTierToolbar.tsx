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
import { STUDENTS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/students/hooks/useStudentsKeyboardShortcuts";

interface StudentsWorkTierToolbarProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  viewingDeleted: boolean;
  canDelete: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
}

export function StudentsWorkTierToolbar({
  studentSearch,
  studentFilterStatus,
  studentFilterGender,
  studentStatusOptions,
  genderFilters,
  viewingDeleted,
  canDelete,
  hasActiveFilters,
  activeFilterCount,
  columnLayout,
  viewMode,
  onViewModeChange,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onToggleDeleted,
  onClearFilters,
}: StudentsWorkTierToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${WORK_SURFACE} p-3`}>
      <SearchBar
        id={STUDENTS_WORK_SEARCH_INPUT_ID}
        value={studentSearch}
        onChange={onSearchChange}
        placeholder={t("students.searchPlaceholder")}
        className="flex-1"
      />

      <StudentsFilterMenuButton
        studentFilterStatus={studentFilterStatus}
        studentFilterGender={studentFilterGender}
        studentStatusOptions={studentStatusOptions}
        genderFilters={genderFilters}
        activeFilterCount={activeFilterCount}
        onToggleStatus={onToggleStatus}
        onGenderChange={onGenderChange}
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
        labels={columnLayout.customizerLabels}
      />
    </div>
  );
}
