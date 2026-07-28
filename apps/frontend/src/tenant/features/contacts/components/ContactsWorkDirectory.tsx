import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import { ContactsBulkActionBar } from "@/tenant/features/contacts/components/ContactsBulkActionBar";
import { ContactsWorkListBody } from "@/tenant/features/contacts/components/ContactsWorkListBody";
import {
  ContactsWorkGenderFilterChip,
  ContactsWorkTruncatedBanner,
} from "@/tenant/features/contacts/components/ContactsWorkDirectoryBanners";
import type { ContactsWorkDirectoryProps } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";
import { useTranslation } from "@/hooks/useTranslation";

export type { ContactsWorkDirectoryProps } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";

export function ContactsWorkDirectory({
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
  viewModeOverride,
  onViewModeChange,
  shownCount,
  workTruncated,
  selected,
  onClearSelection,
  selectedTargets,
  bulkActions,
  canWriteMessaging,
  canExport,
  canDelete,
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
}: ContactsWorkDirectoryProps) {
  const { t } = useTranslation();

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
          showDeletedArchives={viewingDeleted}
          onShowDeletedChange={onShowDeletedChange}
          canViewDeleted={canViewDeleted}
          viewMode={viewModeOverride ?? "table"}
          onViewModeChange={onViewModeChange}
          shownCount={shownCount}
        />
      </ErrorBoundary>

      {workTruncated && <ContactsWorkTruncatedBanner shownCount={shownCount} t={t} />}

      <ContactsWorkGenderFilterChip
        filterGender={filterGender}
        onClear={() => onGenderChange("")}
        t={t}
      />

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
        onClearFilters={onClearFilters}
        viewModeOverride={viewModeOverride}
        commonDirectoryProps={commonDirectoryProps}
        tableProps={tableProps}
        useServerWork={useServerWork}
        workPageData={workPageData}
        onPageChange={onPageChange}
      />
    </div>
  );
}
