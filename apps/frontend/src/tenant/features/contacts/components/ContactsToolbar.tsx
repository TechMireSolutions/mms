import React, { useMemo, useCallback } from "react";
import { SlidersHorizontal, RefreshCw, Archive, Table, LayoutGrid, MessageCircle, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { DEFAULT_COLUMN_REGISTRY, type AppTranslationKey, type ContactsQuickFilter } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";

export type QuickFilterPreset = ContactsQuickFilter;

interface ContactsToolbarProps {
  search: string;
  onSearchChange: (searchValue: string) => void;
  filterGender: string;
  onGenderChange: (gender: string) => void;
  quickFilter?: QuickFilterPreset;
  onQuickFilterChange?: (preset: QuickFilterPreset) => void;
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
  shownCount?: number;
}

export default function ContactsToolbar({
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  quickFilter = "all",
  onQuickFilterChange,
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
  shownCount,
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

  const quickFilterPresets: Array<{
    id: QuickFilterPreset;
    labelKey: AppTranslationKey;
    icon: React.ComponentType<{ className?: string }>;
  }> = useMemo(
    () => [
      { id: "all", labelKey: "contacts.filtersAll", icon: Users },
      { id: "whatsapp", labelKey: "contacts.filtersWhatsApp", icon: MessageCircle },
      { id: "syed", labelKey: "contacts.filtersSyed", icon: CheckCircle2 },
      { id: "missingInfo", labelKey: "contacts.filtersMissingInfo", icon: AlertCircle },
    ],
    [],
  );

  return (
    <div className="space-y-2.5">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {shownCount != null ? t("contacts.selectedCount", { count: shownCount }) : ""}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={t("contacts.searchPlaceholder")}
            className="w-full"
          />
          <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 border border-border/60 rounded">
              /
            </kbd>
          </div>
        </div>

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
            <div className="flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs" role="group" aria-label={t("contacts.viewMode.group")}>
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
          )}

          <ModuleColumnCustomizer
            columnRegistry={columnRegistry}
            updateUserColumnLayout={updateUserColumnLayout}
            onResetLayout={handleResetColumnLayout}
            labels={columnCustomizerLabels}
          />
        </div>
      </div>

      {/* Quick Filter Presets Pill Bar */}
      {onQuickFilterChange && !showDeletedArchives && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickFilterPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = quickFilter === preset.id;
            return (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                onClick={() => onQuickFilterChange(preset.id)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 h-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shadow-none ${
                  isSelected
                    ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs hover:bg-primary/15 hover:text-primary"
                    : "bg-card/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-card/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span>{t(preset.labelKey) || preset.id}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

