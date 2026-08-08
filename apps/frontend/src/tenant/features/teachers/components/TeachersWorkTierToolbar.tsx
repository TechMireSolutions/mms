import { Filter } from "lucide-react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusOptions } from "@/lib/teachers/teacherStatusUi";
import { TEACHERS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/teachers/hooks/useTeachersKeyboardShortcuts";

interface TeachersWorkTierToolbarProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canDelete: boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels: ModuleColumnCustomizerLabels;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onToggleDeleted: () => void;
}

export function TeachersWorkTierToolbar({
  search,
  filterStatus,
  filterSpecialization,
  statusOptions,
  specializationOptions,
  showDeleted,
  canDelete,
  columnRegistry,
  updateUserColumnLayout,
  customizerLabels,
  viewMode,
  onViewModeChange,
  onSearchChange,
  onToggleStatus,
  onSpecializationChange,
  onToggleDeleted,
}: TeachersWorkTierToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
      <SearchBar
        id={TEACHERS_WORK_SEARCH_INPUT_ID}
        value={search}
        onChange={onSearchChange}
        placeholder={t("teachers.searchPlaceholder")}
        className="flex-1"
      />

      <ModuleFilterDropdown
        label={t("teachers.filter.status")}
        activeCount={filterStatus.length}
        icon={Filter}
        contentClassName="w-44"
      >
        <ModuleFilterCheckboxGroup
          label={t("teachers.filter.status")}
          options={teacherStatusOptions(t, statusOptions)}
          selected={filterStatus}
          onToggle={onToggleStatus}
        />
      </ModuleFilterDropdown>

      <ModuleFilterDropdown
        label={filterSpecialization || t("teachers.filter.specialization")}
        activeCount={filterSpecialization ? 1 : 0}
        contentClassName="w-48"
      >
        <ModuleFilterRadioGroup
          label={t("teachers.filter.specialization")}
          value={filterSpecialization}
          onValueChange={onSpecializationChange}
          options={[
            { value: "", label: t("teachers.filter.allSpecializations") },
            ...specializationOptions.map((specialization) => ({
              value: specialization,
              label: specialization,
            })),
          ]}
        />
      </ModuleFilterDropdown>

      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      <ModuleColumnCustomizer
        columnRegistry={columnRegistry}
        updateUserColumnLayout={updateUserColumnLayout}
        labels={customizerLabels}
      />

      {canDelete && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={onToggleDeleted}
          showActiveLabel={t("teachers.showActive")}
          showDeletedLabel={t("teachers.showDeleted")}
        />
      )}
    </div>
  );
}
