import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { StudentsFilterMenuButton } from "@/tenant/features/students/components/StudentsFilterMenuButton";

interface StudentsWorkTierToolbarProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  showDeleted: boolean;
  canDelete: boolean;
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
  showDeleted,
  canDelete,
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
        onToggleStatus={onToggleStatus}
        onGenderChange={onGenderChange}
        onClearFilters={onClearFilters}
      />

      {canDelete && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
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
