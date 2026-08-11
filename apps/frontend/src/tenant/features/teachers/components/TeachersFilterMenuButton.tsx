import { SlidersHorizontal } from "lucide-react";
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusOptions } from "@/lib/teachers/teacherStatusUi";

export interface TeachersFilterMenuButtonProps {
  filterStatus: string[];
  filterSpecialization: string;
  statusOptions: string[];
  specializationOptions: string[];
  activeFilterCount: number;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onClearFilters: () => void;
}

/** Teachers Work single Filters menu — Contacts/Students-shaped status + specialization. */
export function TeachersFilterMenuButton({
  filterStatus,
  filterSpecialization,
  statusOptions,
  specializationOptions,
  activeFilterCount,
  onToggleStatus,
  onSpecializationChange,
  onClearFilters,
}: TeachersFilterMenuButtonProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleFilterDropdown
      label={t("teachers.filters")}
      activeCount={activeFilterCount}
      icon={SlidersHorizontal}
      clearLabel={t("teachers.clearFilters")}
      onClear={onClearFilters}
    >
      <ModuleFilterCheckboxGroup
        label={t("teachers.filter.status")}
        options={teacherStatusOptions(t, statusOptions)}
        selected={filterStatus}
        onToggle={onToggleStatus}
      />

      <ModuleFilterDivider />

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
  );
}
