import { SlidersHorizontal } from "lucide-react";
import {
  CONTACTS_QUICK_FILTER_OPTIONS,
  isContactsQuickFilter,
  type ContactsQuickFilter,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { GenderIcon } from "@/components/ui/GenderIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModuleFiltersMenuTrigger } from "@/components/ui/ModuleFiltersMenuButton";

export interface ContactsFilterMenuButtonProps {
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
}: ContactsFilterMenuButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ModuleFiltersMenuTrigger
          label={t("contacts.filters")}
          activeCount={activeFilterCount}
          icon={SlidersHorizontal}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
        <DropdownMenuLabel className="text-xs text-foreground">
          {t("contacts.filters")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={quickFilter}
          onValueChange={(value) => {
            if (isContactsQuickFilter(value)) onQuickFilterChange(value);
          }}
        >
          {CONTACTS_QUICK_FILTER_OPTIONS.map((preset) => (
            <DropdownMenuRadioItem key={preset.id} value={preset.id} className="text-sm">
              {t(preset.labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuLabel className="text-xs text-foreground">
          {t("contacts.genderFilter")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={filterGender} onValueChange={onGenderChange}>
          {["", ...genders].map((genderOption) => (
            <DropdownMenuRadioItem
              key={genderOption || "all"}
              value={genderOption}
              className="text-sm"
            >
              {genderOption ? (
                <span className="inline-flex items-center gap-1.5">
                  <GenderIcon gender={genderOption} className="w-3.5 h-3.5" />
                  {formatContactGenderLabel(genderOption, t)}
                </span>
              ) : (
                t("contacts.allGenders")
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.sortBy")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sortField} onValueChange={onSort}>
          {sortOptions.map((sortOption) => (
            <DropdownMenuRadioItem
              key={sortOption.field}
              value={sortOption.field}
              className="text-sm"
            >
              {sortOption.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
