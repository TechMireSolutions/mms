import React from "react";
import { SlidersHorizontal, RefreshCw, Archive } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ColumnCustomizer from "@/tenant/features/contacts/components/ColumnCustomizer";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";

interface ContactsToolbarProps {
  search: string;
  onSearchChange: (searchValue: string) => void;
  filterGender: string;
  onGenderChange: (gender: string) => void;
  sortField: string;
  onSort: (field: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
   showDeletedArchives?: boolean;
  onShowDeletedChange?: (show: boolean) => void;
  canViewDeleted?: boolean;
}

/**
 * ContactsToolbar component rendering a search bar,
 * advanced filter/sorting menus, and column customization.
 * @param props Component properties.
 * @returns React element.
 */
export default function ContactsToolbar({
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  sortField,
  onSort,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  showDeletedArchives = false,
  onShowDeletedChange,
  canViewDeleted = false,
}: ContactsToolbarProps): React.JSX.Element {
  const { availableColumns, genders, systemSortOptions } = useContactConfig();
  const { t } = useTranslation();
 
  const sortOptions = React.useMemo(() => {
    const dynamicSorts = availableColumns
      .filter((column) => column.sortField)
      .map((column) => ({
        field: column.sortField!,
        label: column.label,
      }));

    const combined = [...dynamicSorts];
    systemSortOptions.forEach((systemSortOption) => {
      if (!combined.some((existingSortOption) => existingSortOption.field === systemSortOption.field)) {
        combined.push(systemSortOption);
      }
    });

    return combined;
  }, [availableColumns, systemSortOptions]);
 
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("contacts.searchPlaceholder")}
        className="flex-1"
      />
 
      <div className="flex items-center gap-2 flex-shrink-0">
        
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
            <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.genderFilter")}</DropdownMenuLabel>
            {["", ...genders].map((genderOption) => (
              <DropdownMenuCheckboxItem
                key={genderOption}
                checked={filterGender === genderOption}
                onCheckedChange={() => onGenderChange(genderOption)}
                className="text-sm"
              >
                {genderOption ? genderOption.charAt(0).toUpperCase() + genderOption.slice(1) : t("contacts.allGenders")}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.sortBy")}</DropdownMenuLabel>
            {sortOptions.map((sortOption) => (
              <DropdownMenuCheckboxItem
                key={sortOption.field}
                checked={sortField === sortOption.field}
                onCheckedChange={() => onSort(sortOption.field)}
                className="text-sm"
              >
                {sortOption.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("contacts.clearFilters")}</span>
          </Button>
        )}

        {canViewDeleted && onShowDeletedChange && (
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
        )}

        
        <ColumnCustomizer />
      </div>
    </div>
  );
}
