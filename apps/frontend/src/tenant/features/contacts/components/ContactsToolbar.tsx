import React, { type JSX } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { ContactsQuickFilter } from "@mms/shared";
import type { ContactsWorkViewMode } from "@/tenant/features/contacts/components/contactsWorkTierTypes";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { ContactsFilterMenuButton } from "@/tenant/features/contacts/components/ContactsFilterMenuButton";
import { useContactsToolbarModel } from "@/tenant/features/contacts/hooks/useContactsToolbarModel";
import { CONTACTS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/contacts/hooks/useContactsKeyboardShortcuts";

export interface ContactsToolbarProps {
  search: string;
  onSearchChange: (searchValue: string) => void;
  filterGender: string;
  onGenderChange: (gender: string) => void;
  quickFilter: ContactsQuickFilter;
  onQuickFilterChange: (preset: ContactsQuickFilter) => void;
  sortField: string;
  onSort: (field: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  viewingDeleted?: boolean;
  onShowDeletedChange?: (show: boolean) => void;
  canViewDeleted?: boolean;
  viewMode: ContactsWorkViewMode;
  onViewModeChange: (mode: ContactsWorkViewMode) => void;
  shownCount?: number;
}

export const ContactsToolbar = React.memo(function ContactsToolbar({
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  quickFilter,
  onQuickFilterChange,
  sortField,
  onSort,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  viewingDeleted = false,
  onShowDeletedChange,
  canViewDeleted = false,
  viewMode,
  onViewModeChange,
  shownCount,
}: ContactsToolbarProps): JSX.Element {
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
    <>
      <div className="sr-only" role="status" aria-live="polite">
        {shownCount != null ? t("contacts.shownCount", { count: shownCount }) : ""}
      </div>

      <div
        role="region"
        aria-label={t("contacts.filters")}
        className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}
      >
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={CONTACTS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("contacts.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <ContactsFilterMenuButton
            activeFilterCount={activeFilterCount}
            quickFilter={quickFilter}
            onQuickFilterChange={onQuickFilterChange}
            filterGender={filterGender}
            genders={genders}
            onGenderChange={onGenderChange}
            sortField={sortField}
            sortOptions={sortOptions}
            onSort={onSort}
            t={t}
          />

          {hasActiveFilters && (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={t("contacts.clearFilters")}
            />
          )}

          {canViewDeleted && onShowDeletedChange && (
            <ModuleTrashToggle
              showDeleted={viewingDeleted}
              onToggle={() => onShowDeletedChange(!viewingDeleted)}
              showActiveLabel={t("contacts.showActive")}
              showDeletedLabel={t("contacts.showDeleted")}
            />
          )}

          <WorkViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />

          <ModuleColumnCustomizer
            columnRegistry={columnRegistry}
            updateUserColumnLayout={updateUserColumnLayout}
            onResetLayout={handleResetColumnLayout}
            labels={columnCustomizerLabels}
          />
        </div>
      </div>
    </>
  );
});

export default ContactsToolbar;
