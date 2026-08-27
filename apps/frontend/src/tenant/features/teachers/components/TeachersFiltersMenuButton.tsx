import { SlidersHorizontal } from "lucide-react";
import {
  isTeachersQuickFilter,
  TEACHERS_QUICK_FILTER_OPTIONS,
  type TeacherSortField,
  type TeachersQuickFilter,
} from "@mms/shared";
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";
import { GenderIcon } from "@/components/ui/GenderIcon";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusLabel } from "@/lib/teachers/teacherStatusUi";

export interface TeachersFiltersMenuButtonProps {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: TeachersQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  genderFilters: string[];
  statusOptions: string[];
  specializationOptions: string[];
  activeFilterCount: number;
  sortField: TeacherSortField;
  sortOptions: Array<{ field: TeacherSortField; label: string }>;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSortChange: (field: TeacherSortField) => void;
  onClearFilters: () => void;
}

/** Teachers Work single Filters menu — Contacts/Students-shaped quick filter + status + specialization + gender + sort. */
export function TeachersFiltersMenuButton({
  filterStatus,
  filterSpecialization,
  filterGender,
  quickFilter,
  onQuickFilterChange,
  genderFilters,
  statusOptions,
  specializationOptions,
  activeFilterCount,
  sortField,
  sortOptions,
  onToggleStatus,
  onSpecializationChange,
  onGenderChange,
  onSortChange,
  onClearFilters,
}: TeachersFiltersMenuButtonProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleFilterDropdown
      label={t("teachers.filters")}
      activeCount={activeFilterCount}
      icon={SlidersHorizontal}
      clearLabel={t("teachers.clearFilters")}
      onClear={onClearFilters}
    >
      <ModuleFilterRadioGroup
        label={t("teachers.filters")}
        value={quickFilter}
        options={TEACHERS_QUICK_FILTER_OPTIONS.map((option) => ({
          value: option.id,
          label: t(option.labelKey),
        }))}
        onValueChange={(value) => {
          if (isTeachersQuickFilter(value)) onQuickFilterChange(value);
        }}
      />

      <ModuleFilterDivider />

      <ModuleFilterCheckboxGroup
        label={t("teachers.filter.status")}
        options={statusOptions.map((status) => ({
          value: status,
          label: teacherStatusLabel(t, status),
        }))}
        selected={filterStatus}
        onToggle={onToggleStatus}
      />

      <ModuleFilterDivider />

      <ModuleFilterRadioGroup
        label={t("teachers.filter.gender")}
        value={filterGender}
        options={[
          { value: "all", label: t("teachers.filter.allGenders") },
          ...genderFilters.map((gender) => ({
            value: gender,
            label: formatContactGenderLabel(gender, t),
            icon: <GenderIcon gender={gender} className="w-3.5 h-3.5" aria-hidden="true" />,
          })),
        ]}
        onValueChange={onGenderChange}
      />

      {specializationOptions.length > 0 && (
        <>
          <ModuleFilterDivider />
          <ModuleFilterRadioGroup
            label={t("teachers.filter.specialization")}
            value={filterSpecialization}
            options={[
              { value: "all", label: t("teachers.filter.allSpecializations") },
              ...specializationOptions.map((specialization) => ({
                value: specialization,
                label: specialization,
              })),
            ]}
            onValueChange={onSpecializationChange}
          />
        </>
      )}

      {sortOptions.length > 0 && (
        <>
          <ModuleFilterDivider />
          <ModuleFilterRadioGroup
            label={t("teachers.sortBy")}
            value={sortField}
            options={sortOptions.map((option) => ({
              value: option.field,
              label: option.label,
            }))}
            onValueChange={(field) => onSortChange(field as TeacherSortField)}
          />
        </>
      )}
    </ModuleFilterDropdown>
  );
}
