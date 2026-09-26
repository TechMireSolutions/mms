import { SlidersHorizontal } from "lucide-react";
import {
  isTeachersQuickFilter,
  TEACHERS_QUICK_FILTER_OPTIONS,
  type FacultySortField,
  type FacultyQuickFilter,
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
import { facultyStatusLabel } from "@/lib/faculty/facultyStatusUi";

export interface FacultyFiltersMenuButtonProps {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: FacultyQuickFilter | TeachersQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  genderFilters: string[];
  statusOptions: string[];
  specializationOptions: string[];
  activeFilterCount: number;
  sortField: FacultySortField | TeacherSortField;
  sortOptions: Array<{ field: FacultySortField | TeacherSortField; label: string }>;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSortChange: (field: FacultySortField) => void;
  onClearFilters: () => void;
}
export type TeachersFiltersMenuButtonProps = FacultyFiltersMenuButtonProps;

/** Faculty Work single Filters menu — Contacts/Students-shaped quick filter + status + specialization + gender + sort. */
export function FacultyFiltersMenuButton({

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
      label={t("faculty.filters") || t("teachers.filters")}
      activeCount={activeFilterCount}
      icon={SlidersHorizontal}
      clearLabel={t("faculty.clearFilters") || t("teachers.clearFilters")}
      onClear={onClearFilters}
    >
      <ModuleFilterRadioGroup
        label={t("faculty.filters") || t("teachers.filters")}
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
        label={t("faculty.filter.status") || t("teachers.filter.status")}
        options={statusOptions.map((status) => ({
          value: status,
          label: facultyStatusLabel(t, status),
        }))}
        selected={filterStatus}
        onToggle={onToggleStatus}
      />

      <ModuleFilterDivider />

      <ModuleFilterRadioGroup
        label={t("faculty.filter.gender") || t("teachers.filter.gender")}
        value={filterGender}
        options={[
          { value: "all", label: t("faculty.filter.allGenders") || t("teachers.filter.allGenders") },
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
            label={t("faculty.filter.specialization") || t("teachers.filter.specialization")}
            value={filterSpecialization}
            options={[
              { value: "all", label: t("faculty.filter.allSpecializations") || t("teachers.filter.allSpecializations") },
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
            label={t("faculty.sortBy") || t("teachers.sortBy")}
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

export const TeachersFiltersMenuButton = FacultyFiltersMenuButton;

