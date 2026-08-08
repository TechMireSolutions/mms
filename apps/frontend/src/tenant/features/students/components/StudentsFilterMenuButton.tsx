import { SlidersHorizontal } from "lucide-react";
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";

export interface StudentsFilterMenuButtonProps {
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  activeFilterCount: number;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onClearFilters: () => void;
}

export function StudentsFilterMenuButton({
  studentFilterStatus,
  studentFilterGender,
  studentStatusOptions,
  genderFilters,
  activeFilterCount,
  onToggleStatus,
  onGenderChange,
  onClearFilters,
}: StudentsFilterMenuButtonProps) {
  const { t } = useTranslation();

  return (
    <ModuleFilterDropdown
      label={t("students.filters")}
      activeCount={activeFilterCount}
      icon={SlidersHorizontal}
      clearLabel={t("students.clearAllFilters")}
      onClear={onClearFilters}
    >
      <ModuleFilterCheckboxGroup
        label={t("students.filterByStatus")}
        options={studentStatusOptions.map((status) => ({
          value: status,
          label: studentStatusLabel(t, status),
        }))}
        selected={studentFilterStatus}
        onToggle={onToggleStatus}
      />

      <ModuleFilterDivider />
      <ModuleFilterRadioGroup
        label={t("students.gender")}
        value={studentFilterGender}
        onValueChange={onGenderChange}
        options={["", ...genderFilters].map((genderFilter) => ({
          value: genderFilter,
          label: genderFilter
            ? formatContactGenderLabel(genderFilter, t)
            : t("students.allGenders"),
        }))}
      />
    </ModuleFilterDropdown>
  );
}
