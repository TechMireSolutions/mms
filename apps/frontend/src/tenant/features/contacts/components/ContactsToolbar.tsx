import React from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import type { ContactsQuickFilter } from "@mms/shared";
import { ContactsQuickFilterBar } from "@/tenant/features/contacts/components/ContactsQuickFilterBar";
import {
  ContactsClearFiltersButton,
  ContactsDeletedToggleButton,
  ContactsFilterMenuButton,
  ContactsViewModeToggle,
} from "@/tenant/features/contacts/components/ContactsToolbarControls";
import { useContactsToolbarModel } from "@/tenant/features/contacts/hooks/useContactsToolbarModel";

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
  const {
    t,
    genders,
    sortOptions,
    columnRegistry,
    updateUserColumnLayout,
    handleResetColumnLayout,
    columnCustomizerLabels,
  } = useContactsToolbarModel();

  return (
    <div className="space-y-2.5">
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
          <div className="hidden md:flex absolute end-3 top-1/2 -translate-y-1/2 items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 border border-border/60 rounded">
              /
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ContactsFilterMenuButton
            activeFilterCount={activeFilterCount}
            filterGender={filterGender}
            genders={genders}
            onGenderChange={onGenderChange}
            sortField={sortField}
            sortOptions={sortOptions}
            onSort={onSort}
            t={t}
          />

          {hasActiveFilters && (
            <ContactsClearFiltersButton onClearFilters={onClearFilters} t={t} />
          )}

          {canViewDeleted && onShowDeletedChange && (
            <ContactsDeletedToggleButton
              showDeletedArchives={showDeletedArchives}
              onShowDeletedChange={onShowDeletedChange}
              t={t}
            />
          )}

          {onViewModeChange && (
            <ContactsViewModeToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              t={t}
            />
          )}

          <ModuleColumnCustomizer
            columnRegistry={columnRegistry}
            updateUserColumnLayout={updateUserColumnLayout}
            onResetLayout={handleResetColumnLayout}
            labels={columnCustomizerLabels}
          />
        </div>
      </div>

      {onQuickFilterChange && !showDeletedArchives && (
        <ContactsQuickFilterBar
          quickFilter={quickFilter}
          onQuickFilterChange={onQuickFilterChange}
        />
      )}
    </div>
  );
}
