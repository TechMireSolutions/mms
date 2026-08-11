import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips } from "@/components/ui/FilterChips";
import { useTranslation } from "@/hooks/useTranslation";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import { ContactsBulkActionBar } from "@/tenant/features/contacts/components/ContactsBulkActionBar";
import { ContactsWorkListBody } from "@/tenant/features/contacts/components/ContactsWorkListBody";
import { buildContactsWorkFilterChips } from "@/tenant/features/contacts/components/buildContactsWorkFilterChips";
import type { ContactsWorkTierProps } from "@/tenant/features/contacts/components/contactsWorkTierTypes";

export type { ContactsWorkTierProps } from "@/tenant/features/contacts/components/contactsWorkTierTypes";

export function ContactsWorkTier({
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
  viewingDeleted,
  onShowDeletedChange,
  canViewDeleted,
  viewMode,
  onViewModeChange,
  shownCount,
  selected,
  onClearSelection,
  selectedTargets,
  bulkActions,
  canWriteMessaging,
  canExport,
  canDelete,
  canWrite,
  onWhatsApp,
  onSms,
  onEmail,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  isWorkError,
  isWorkLoading,
  isWorkFetching,
  onRetryWork,
  workContacts,
  tableColumns,
  commonDirectoryProps,
  tableProps,
  useServerWork,
  workPageData,
  onPageChange,
}: ContactsWorkTierProps) {
  const { t } = useTranslation();
  const filterChips = buildContactsWorkFilterChips({
    filterGender,
    quickFilter,
    onGenderChange,
    onQuickFilterChange,
    t,
  });

  return (
    <div className="space-y-5">
      <ErrorBoundary>
        <ContactsToolbar
          search={search}
          onSearchChange={onSearchChange}
          filterGender={filterGender}
          onGenderChange={onGenderChange}
          quickFilter={quickFilter}
          onQuickFilterChange={onQuickFilterChange}
          sortField={sortField}
          onSort={onSort}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          viewingDeleted={viewingDeleted}
          onShowDeletedChange={onShowDeletedChange}
          canViewDeleted={canViewDeleted}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          shownCount={shownCount}
        />
      </ErrorBoundary>

      <FilterChips chips={filterChips} onClearAll={onClearFilters} />

      <ContactsBulkActionBar
        selectedCount={selected.length}
        viewingDeleted={viewingDeleted}
        bulkActions={bulkActions}
        canWriteMessaging={canWriteMessaging}
        canExport={canExport}
        canDelete={canDelete}
        selectedTargets={selectedTargets}
        onWhatsApp={onWhatsApp}
        onSms={onSms}
        onEmail={onEmail}
        onBulkExport={onBulkExport}
        onRequestBulkDelete={onRequestBulkDelete}
        onRequestBulkRestore={onRequestBulkRestore}
        onClearSelection={onClearSelection}
      />

      <ContactsWorkListBody
        isWorkError={isWorkError}
        isWorkLoading={isWorkLoading}
        isWorkFetching={isWorkFetching}
        onRetryWork={onRetryWork}
        workContacts={workContacts}
        tableColumns={tableColumns}
        hasActiveFilters={hasActiveFilters}
        viewingDeleted={viewingDeleted}
        canWrite={canWrite}
        onClearFilters={onClearFilters}
        onShowDeletedChange={onShowDeletedChange}
        viewMode={viewMode}
        commonDirectoryProps={commonDirectoryProps}
        tableProps={tableProps}
        useServerWork={useServerWork}
        workPageData={workPageData}
        onPageChange={onPageChange}
      />
    </div>
  );
}
