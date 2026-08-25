import { SlidersHorizontal } from "lucide-react";
import {
  STUDENTS_QUICK_FILTER_OPTIONS,
  isStudentsQuickFilter,
  type StudentsQuickFilter,
} from "@mms/shared";
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";
import { GenderIcon } from "@/components/ui/GenderIcon";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentsListContentSortField } from "@/tenant/features/students/components/studentsListTypes";

interface StudentsFilterMenuButtonProps {
  studentFilterStatus: string[];
  studentFilterGender: string;
  quickFilter: StudentsQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  isStatusEnabled?: boolean;
  isGenderEnabled?: boolean;
  activeFilterCount: number;
  sortField: StudentsListContentSortField | null;
  sortOptions: Array<{ field: StudentsListContentSortField; label: string }>;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onSortChange: (field: StudentsListContentSortField) => void;
  onClearFilters: () => void;
}

export function StudentsFilterMenuButton({
  studentFilterStatus,
  studentFilterGender,
  quickFilter,
  onQuickFilterChange,
  studentStatusOptions,
  genderFilters,
  isStatusEnabled = true,
  isGenderEnabled = true,
  activeFilterCount,
  sortField,
  sortOptions,
  onToggleStatus,
  onGenderChange,
  onSortChange,
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
      <ModuleFilterRadioGroup
        label={t("students.filters")}
        value={quickFilter}
        onValueChange={(value) => {
          if (isStudentsQuickFilter(value)) onQuickFilterChange(value);
        }}
        options={STUDENTS_QUICK_FILTER_OPTIONS.map((preset) => ({
          value: preset.id,
          label: t(preset.labelKey),
        }))}
      />

      {isStatusEnabled && (
        <>
          <ModuleFilterDivider />
          <ModuleFilterCheckboxGroup
            label={t("students.filterByStatus")}
            options={studentStatusOptions.map((status) => ({
              value: status,
              label: studentStatusLabel(t, status),
            }))}
            selected={studentFilterStatus}
            onToggle={onToggleStatus}
          />
        </>
      )}

      {isGenderEnabled && (
        <>
          <ModuleFilterDivider />
          <ModuleFilterRadioGroup
            label={t("students.gender")}
            value={studentFilterGender}
            onValueChange={onGenderChange}
            options={["", ...genderFilters].map((genderFilter) => ({
              value: genderFilter,
              label: genderFilter ? (
                <span className="inline-flex items-center gap-1.5">
                  <GenderIcon gender={genderFilter} className="w-3.5 h-3.5" />
                  {formatContactGenderLabel(genderFilter, t)}
                </span>
              ) : (
                t("students.allGenders")
              ),
            }))}
          />
        </>
      )}

      <ModuleFilterDivider />
      <ModuleFilterRadioGroup
        label={t("students.sortBy")}
        value={sortField ?? ""}
        onValueChange={(value) => {
          const match = sortOptions.find((option) => option.field === value);
          if (match) onSortChange(match.field);
        }}
        options={sortOptions.map((option) => ({
          value: option.field,
          label: option.label,
        }))}
      />
    </ModuleFilterDropdown>
  );
}
