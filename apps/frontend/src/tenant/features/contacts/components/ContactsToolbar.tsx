import React, { useMemo, useCallback } from "react";
import { SlidersHorizontal, RefreshCw, Archive, Table, LayoutGrid } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { DEFAULT_COLUMN_REGISTRY } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";

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
  viewMode?: "table" | "cards";
  onViewModeChange?: (mode: "table" | "cards") => void;
}

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
  viewMode = "table",
  onViewModeChange,
}: ContactsToolbarProps): React.JSX.Element {
  const { availableColumns, genders, systemSortOptions, columnRegistry, updateUserColumnLayout } = useContactConfig();
  const { t } = useTranslation();

  const sortOptions = useMemo(() => {
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

  const handleResetColumnLayout = useCallback(() => {
    updateUserColumnLayout(DEFAULT_COLUMN_REGISTRY);
  }, [updateUserColumnLayout]);

  const columnCustomizerLabels = useMemo(
    () => ({
      trigger: t("contacts.columns"),
      title: t("contacts.columns"),
      visibleAndOrder: t("contacts.visibleAndOrder"),
      hidden: t("contacts.hidden"),
      fixed: t("contacts.fixed"),
      hideColumn: (label: string) => t("contacts.hideColumn", { label }),
      reset: t("contacts.resetLayout"),
      searchPlaceholder: t("contacts.searchColumnsPlaceholder"),
    }),
    [t],
  );

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
                {genderOption ? formatContactGenderLabel(genderOption, t) : t("contacts.allGenders")}
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

        {onViewModeChange && (
          <div className="flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs" role="group" aria-label="View Mode">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onViewModeChange("table")}
              className={`h-9 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Table View"
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
              aria-label="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <ModuleColumnCustomizer
          columnRegistry={columnRegistry}
          updateUserColumnLayout={updateUserColumnLayout}
          onResetLayout={handleResetColumnLayout}
          labels={columnCustomizerLabels}
        />
      </div>
    </div>
  );
}
