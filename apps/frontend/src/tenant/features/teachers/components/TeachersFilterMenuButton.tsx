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
import { teacherStatusOptions } from "@/lib/teachers/teacherStatusUi";

export interface TeachersFilterMenuButtonProps {
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
export function TeachersFilterMenuButton({
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
      <ModuleFilterRadioGroup
        label={t("teachers.filters")}
        value={quickFilter}
        onValueChange={(value) => {
          if (isTeachersQuickFilter(value)) onQuickFilterChange(value);
        }}
        options={TEACHERS_QUICK_FILTER_OPTIONS.map((preset) => ({
          value: preset.id,
          label: t(preset.labelKey),
        }))}
      />

      <ModuleFilterDivider />

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

      <ModuleFilterDivider />

      <ModuleFilterRadioGroup
        label={t("teachers.filter.gender")}
        value={filterGender}
        onValueChange={onGenderChange}
        options={["", ...genderFilters].map((genderFilter) => ({
          value: genderFilter,
          label: genderFilter ? (
            <span className="inline-flex items-center gap-1.5">
              <GenderIcon gender={genderFilter} className="w-3.5 h-3.5" />
              {formatContactGenderLabel(genderFilter, t)}
            </span>
          ) : (
            t("teachers.filter.allGenders")
          ),
        }))}
      />

      <ModuleFilterDivider />

      <ModuleFilterRadioGroup
        label={t("teachers.sortBy")}
        value={sortField}
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
