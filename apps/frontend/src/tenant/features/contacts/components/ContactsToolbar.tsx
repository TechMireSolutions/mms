import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { ContactsQuickFilter } from "@mms/shared";
import type { ContactsWorkViewMode } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";
import {
  ContactsClearFiltersButton,
  ContactsDeletedToggleButton,
  ContactsFilterMenuButton,
} from "@/tenant/features/contacts/components/ContactsToolbarControls";
import { useContactsToolbarModel } from "@/tenant/features/contacts/hooks/useContactsToolbarModel";
import { CONTACTS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/contacts/hooks/useContactsKeyboardShortcuts";

interface ContactsToolbarProps {
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
  showDeletedArchives?: boolean;
  onShowDeletedChange?: (show: boolean) => void;
  canViewDeleted?: boolean;
  viewMode: ContactsWorkViewMode;
  onViewModeChange: (mode: ContactsWorkViewMode) => void;
  shownCount?: number;
}

export default function ContactsToolbar({
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
  showDeletedArchives = false,
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

      <div className="flex flex-col sm:flex-row gap-2">
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
            <ContactsClearFiltersButton onClearFilters={onClearFilters} t={t} />
          )}

          {canViewDeleted && onShowDeletedChange && (
            <ContactsDeletedToggleButton
              showDeletedArchives={showDeletedArchives}
              onShowDeletedChange={onShowDeletedChange}
              t={t}
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
}
