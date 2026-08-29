import { useMemo, type ComponentProps } from "react";
import type ContactsListCards from "@/tenant/features/contacts/components/ContactsListCards";
import type ContactsListDesktopTable from "@/tenant/features/contacts/components/ContactsListDesktopTable";
import type { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import type { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import type { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import type { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";
import type { useContactsSelectionTargets } from "@/tenant/features/contacts/hooks/useContactsSelectionTargets";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/contactTableTypes";

type Directory = ReturnType<typeof useContactsDirectory>;
type Overlay = ReturnType<typeof useContactsPageOverlayState>;
type Messaging = ReturnType<typeof useContactsMessagingActions>;
type Actions = ReturnType<typeof useContactsPageActions>;
type SelectedTargets = ReturnType<typeof useContactsSelectionTargets>;

/** Maps directory / overlay slices into ContactsPageTabPanelProps. */
export function useContactsPageTabPanelProps({
  effectiveTab,
  directory,
  overlay,
  messaging,
  actions,
  selectedTargets,
  viewingDeleted,
  bulkActions,
  canExport,
  canWrite,
  canDelete,
  canEditSetup,
  tableColumns,
  commonDirectoryProps,
  tableProps,
  handleBulkExport,
}: {
  effectiveTab: string;
  directory: Directory;
  overlay: Pick<Overlay, "viewMode" | "setViewMode">;
  messaging: Pick<Messaging, "canWriteMessaging" | "handleWhatsApp" | "handleSms" | "handleEmail">;
  actions: Pick<
    Actions,
    "requestBulkDelete" | "requestBulkRestore" | "handleImport" | "handleBulkTag"
  >;
  selectedTargets: SelectedTargets;
  viewingDeleted: boolean;
  bulkActions: readonly string[];
  canExport: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canEditSetup: boolean;
  tableColumns: ContactsColumnConfig[];
  commonDirectoryProps: ComponentProps<typeof ContactsListCards>;
  tableProps: ComponentProps<typeof ContactsListDesktopTable>;
  handleBulkExport: () => void | Promise<void>;
}) {
  return useMemo(
    () => ({
      workTierProps: {

      effectiveTab,
      search: directory.search,
      onSearchChange: directory.setSearch,
      filterGender: directory.filterGender,
      onGenderChange: directory.setFilterGender,
      quickFilter: directory.quickFilter,
      onQuickFilterChange: directory.setQuickFilter,
      sortField: directory.sortField,
      sortDir: directory.sortDir,
      onSort: directory.handleSort,
      hasActiveFilters: directory.hasActiveFilters,
      activeFilterCount: directory.activeFilterCount,
      onClearFilters: directory.clearFilters,
      viewingDeleted,
      onShowDeletedChange: (next: boolean) => {
        directory.setViewingDeleted(next);
        directory.setSelected([]);
      },
      canViewDeleted: canDelete,
      viewMode: overlay.viewMode,
      onViewModeChange: overlay.setViewMode,
      shownCount: directory.shownCount,
      selected: directory.selected,
      onClearSelection: () => directory.setSelected([]),
      selectedTargets,
      bulkActions,
      canWriteMessaging: messaging.canWriteMessaging,
      canExport,
      canDelete,
      onWhatsApp: messaging.handleWhatsApp,
      onSms: messaging.handleSms,
      onEmail: messaging.handleEmail,
      onBulkExport: handleBulkExport,
      onRequestBulkDelete: actions.requestBulkDelete,
      onRequestBulkRestore: actions.requestBulkRestore,
      onBulkTag: actions.handleBulkTag,
      isWorkError: directory.isWorkError,
      isWorkLoading: directory.isWorkLoading,
      isWorkFetching: directory.isWorkFetching,
      onRetryWork: () => {
        void directory.refetchWork();
      },
      workContacts: directory.workContacts,
      tableColumns,
      commonDirectoryProps,
      tableProps,
      useServerWork: directory.useServerWork,
      workPageData: directory.workPageData,
      onPageChange: directory.setListPage,
      canWrite
      },
      setupTierProps: {
        canWrite,
        canEditSetup,
        onImport: actions.handleImport
      }
    }),
    [
      effectiveTab,
      directory,
      viewingDeleted,
      overlay,
      selectedTargets,
      bulkActions,
      messaging,
      canExport,
      canWrite,
      canDelete,
      canEditSetup,
      handleBulkExport,
      actions,
      tableColumns,
      commonDirectoryProps,
      tableProps,
    ],
  );
}
