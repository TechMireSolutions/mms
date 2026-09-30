import { SlidersHorizontal } from "lucide-react";
import {
  isFacultyQuickFilter,
  FACULTY_QUICK_FILTER_OPTIONS,
  FACULTY_SORT_FIELD_SET,
  type FacultySortField,
  type FacultyQuickFilter,
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
  quickFilter: FacultyQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  genderFilters: string[];
  statusOptions: string[];
  specializationOptions: string[];
  activeFilterCount: number;
  sortField: FacultySortField;
  sortOptions: Array<{ field: FacultySortField; label: string }>;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSortChange: (field: FacultySortField) => void;
  onClearFilters: () => void;
}

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
}: FacultyFiltersMenuButtonProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleFilterDropdown
      label={t("faculty.filters")}
      activeCount={activeFilterCount}
      icon={SlidersHorizontal}
      clearLabel={t("faculty.clearFilters")}
      onClear={onClearFilters}
    >
      <ModuleFilterRadioGroup
        label={t("faculty.filters")}
        value={quickFilter}
        options={FACULTY_QUICK_FILTER_OPTIONS.map((option) => ({
          value: option.id,
          label: t(option.labelKey),
        }))}
        onValueChange={(value) => {
          if (isFacultyQuickFilter(value)) onQuickFilterChange(value);
        }}
      />

      <ModuleFilterDivider />

      <ModuleFilterCheckboxGroup
        label={t("faculty.filter.status")}
        options={statusOptions.map((status) => ({
          value: status,
          label: facultyStatusLabel(t, status),
        }))}
        selected={filterStatus}
        onToggle={onToggleStatus}
      />

      <ModuleFilterDivider />

      <ModuleFilterRadioGroup
        label={t("faculty.filter.gender")}
        value={filterGender}
        options={[
          { value: "all", label: t("faculty.filter.allGenders") },
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
            label={t("faculty.filter.specialization")}
            value={filterSpecialization}
            options={[
              { value: "all", label: t("faculty.filter.allSpecializations") },
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
            label={t("faculty.sortBy")}
            value={sortField}
            options={sortOptions.map((option) => ({
              value: option.field,
              label: option.label,
            }))}
            onValueChange={(field) => {
              if (FACULTY_SORT_FIELD_SET.has(field)) {
                onSortChange(field as FacultySortField);
              }
            }}
          />
        </>
      )}
    </ModuleFilterDropdown>
  );
}
