import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import { ContactsBulkActionBar } from "@/tenant/features/contacts/components/ContactsBulkActionBar";
import { ContactsWorkListBody } from "@/tenant/features/contacts/components/ContactsWorkListBody";
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
  return (
    <div className="space-y-4">
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
