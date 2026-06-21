import React from "react";
import { Search, SlidersHorizontal, RefreshCw, X, Archive } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ColumnCustomizer from "./ColumnCustomizer";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import useTranslation from "@/hooks/useTranslation";

interface ContactsToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterGender: string;
  onGenderChange: (gender: string) => void;
  filterLifecycleStage?: string;
  onLifecycleStageChange?: (stage: string) => void;
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
  filterLifecycleStage = "",
  onLifecycleStageChange,
  sortField,
  onSort,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  showDeletedArchives = false,
  onShowDeletedChange,
  canViewDeleted = false,
}: ContactsToolbarProps): React.JSX.Element {
  const { availableColumns, genders, systemSortOptions, lifecycleStages } = useContactConfig();
  const { t } = useTranslation();
 
  const sortOptions = React.useMemo(() => {
    const dynamicSorts = availableColumns
      .filter((col) => col.sortField)
      .map((col) => ({
        field: col.sortField!,
        label: col.label,
      }));

    const combined = [...dynamicSorts];
    systemSortOptions.forEach((ss) => {
      if (!combined.some((c) => c.field === ss.field)) {
        combined.push(ss);
      }
    });

    return combined;
  }, [availableColumns, systemSortOptions]);
 
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("contacts.searchPlaceholder")}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("contacts.clearFilters")}
            >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
 
      <div className="flex items-center gap-2 flex-shrink-0">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t("contacts.filters")}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
            <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.genderFilter")}</DropdownMenuLabel>
            {["", ...genders].map((g) => (
              <DropdownMenuCheckboxItem
                key={g}
                checked={filterGender === g}
                onCheckedChange={() => onGenderChange(g)}
                className="text-sm"
              >
                {g ? g.charAt(0).toUpperCase() + g.slice(1) : t("contacts.allGenders")}
              </DropdownMenuCheckboxItem>
            ))}
            {onLifecycleStageChange && lifecycleStages.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.lifecycleFilter")}</DropdownMenuLabel>
                {["", ...lifecycleStages].map((stage) => (
                  <DropdownMenuCheckboxItem
                    key={stage || "all"}
                    checked={filterLifecycleStage === stage}
                    onCheckedChange={() => onLifecycleStageChange(stage)}
                    className="text-sm"
                  >
                    {stage || t("contacts.allLifecycleStages")}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs text-foreground">{t("contacts.sortBy")}</DropdownMenuLabel>
            {sortOptions.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.field}
                checked={sortField === s.field}
                onCheckedChange={() => onSort(s.field)}
                className="text-sm"
              >
                {s.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("contacts.clearFilters")}</span>
          </button>
        )}

        {canViewDeleted && onShowDeletedChange && (
          <button
            type="button"
            onClick={() => onShowDeletedChange(!showDeletedArchives)}
            aria-pressed={showDeletedArchives}
            className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
              showDeletedArchives
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showDeletedArchives ? t("contacts.showActive") : t("contacts.showDeleted")}</span>
          </button>
        )}

        
        <ColumnCustomizer />
      </div>
    </div>
  );
}
