import { Archive, LayoutGrid, RefreshCw, SlidersHorizontal, Table } from "lucide-react";
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

export function ContactsFilterMenuButton({
  activeFilterCount,
  filterGender,
  genders,
  onGenderChange,
  sortField,
  sortOptions,
  onSort,
  t,
}: {
  activeFilterCount: number;
  filterGender: string;
  genders: string[];
  onGenderChange: (gender: string) => void;
  sortField: string;
  sortOptions: Array<{ field: string; label: string }>;
  onSort: (field: string) => void;
  t: TranslationFunction;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
            activeFilterCount > 0
              ? "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5"
              : "border-border bg-card text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t("contacts.filters")}</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
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

export function ContactsClearFiltersButton({
  onClearFilters,
  t,
}: {
  onClearFilters: () => void;
  t: TranslationFunction;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClearFilters}
      className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      <span>{t("contacts.clearFilters")}</span>
    </Button>
  );
}

export function ContactsDeletedToggleButton({
  showDeletedArchives,
  onShowDeletedChange,
  t,
}: {
  showDeletedArchives: boolean;
  onShowDeletedChange: (show: boolean) => void;
  t: TranslationFunction;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onShowDeletedChange(!showDeletedArchives)}
      aria-pressed={showDeletedArchives}
      className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
        showDeletedArchives
          ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      <Archive className="w-3.5 h-3.5" />
      <span>{showDeletedArchives ? t("contacts.showActive") : t("contacts.showDeleted")}</span>
    </Button>
  );
}

export function ContactsViewModeToggle({
  viewMode,
  onViewModeChange,
  t,
}: {
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  t: TranslationFunction;
}) {
  return (
    <div
      className="flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs"
      role="group"
      aria-label={t("contacts.viewMode.group")}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("table")}
        className={`h-9 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("contacts.viewMode.table")}
      >
        <Table className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("cards")}
        className={`h-9 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "cards"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("contacts.viewMode.cards")}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
