import type { JSX } from "react";
import {
  CONTACTS_QUICK_FILTER_OPTIONS,
  isContactsQuickFilter,
  type ContactsQuickFilter,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { GenderIcon } from "@/components/ui/GenderIcon";
import {
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from "@/components/ui/ModuleFiltersMenuButton";

interface ContactsFilterMenuButtonProps {
  activeFilterCount: number;
  quickFilter: ContactsQuickFilter;
  onQuickFilterChange: (preset: ContactsQuickFilter) => void;
  filterGender: string;
  genders: string[];
  onGenderChange: (gender: string) => void;
  sortField: string;
  sortOptions: Array<{ field: string; label: string }>;
  onSort: (field: string) => void;
  t: TranslationFunction;
}

export function ContactsFilterMenuButton({
  activeFilterCount,
  quickFilter,
  onQuickFilterChange,
  filterGender,
  genders,
  onGenderChange,
  sortField,
  sortOptions,
  onSort,
  t,
}: ContactsFilterMenuButtonProps): JSX.Element {
  return (
    <ModuleFilterDropdown
      label={t("contacts.filters")}
      activeCount={activeFilterCount}
    >
      <ModuleFilterRadioGroup
        label={t("contacts.filters")}
        value={quickFilter}
        onValueChange={(value) => {
          if (isContactsQuickFilter(value)) onQuickFilterChange(value);
        }}
        options={CONTACTS_QUICK_FILTER_OPTIONS.map((preset) => ({
          value: preset.id,
          label: t(preset.labelKey),
        }))}
      />

      <ModuleFilterDivider />
      <ModuleFilterRadioGroup
        label={t("contacts.genderFilter")}
        value={filterGender}
        onValueChange={onGenderChange}
        options={["", ...genders].map((genderOption) => ({
          value: genderOption,
          label: genderOption ? (
            <span className="inline-flex items-center gap-1.5">
              <GenderIcon gender={genderOption} className="w-3.5 h-3.5" />
              {formatContactGenderLabel(genderOption, t)}
            </span>
          ) : (
            t("contacts.allGenders")
          ),
        }))}
      />

      <ModuleFilterDivider />
      <ModuleFilterRadioGroup
        label={t("contacts.sortBy")}
        value={sortField}
        onValueChange={onSort}
        options={sortOptions.map((sortOption) => ({
          value: sortOption.field,
          label: sortOption.label,
        }))}
      />
    </ModuleFilterDropdown>
  );
}
