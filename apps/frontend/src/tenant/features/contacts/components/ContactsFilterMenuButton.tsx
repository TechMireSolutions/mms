import { SlidersHorizontal } from "lucide-react";
import {
  CONTACTS_QUICK_FILTER_OPTIONS,
  isContactsQuickFilter,
  type ContactsQuickFilter,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
        <Button
          type="button"
          variant="ghost"
          className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
            activeFilterCount > 0
              ? "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5"
              : "border-border bg-card text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("contacts.filters")}</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
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
              {genderOption ? formatContactGenderLabel(genderOption, t) : t("contacts.allGenders")}
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
