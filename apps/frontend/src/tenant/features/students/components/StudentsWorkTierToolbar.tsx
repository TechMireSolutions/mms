import { RefreshCw } from "lucide-react";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/button";
import {
  WORK_SURFACE,
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
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
  showDeleted: boolean;
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
  showDeleted,
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
        <Button
          type="button"
          variant="ghost"
          onClick={onClearFilters}
          className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE)}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("students.clearFilters")}</span>
        </Button>
      ) : null}

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
