import { useCallback, useMemo, type ComponentProps } from "react";
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
  const {
    search,
    setSearch,
    filterGender,
    setFilterGender,
    quickFilter,
    setQuickFilter,
    sortField,
    sortDir,
    handleSort,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
    setViewingDeleted,
    selected,
    setSelected,
    shownCount,
    isWorkError,
    isWorkLoading,
    isWorkFetching,
    refetchWork,
    workContacts,
    useServerWork,
    workPageData,
    setListPage,
  } = directory;

  const handleShowDeletedChange = useCallback(
    (next: boolean) => {
      setViewingDeleted(next);
      setSelected([]);
    },
    [setViewingDeleted, setSelected],
  );

  const handleClearSelection = useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  const handleRetryWork = useCallback(() => {
    void refetchWork();
  }, [refetchWork]);

  return useMemo(
    () => ({
      workTierProps: {
        effectiveTab,
        search,
        onSearchChange: setSearch,
        filterGender,
        onGenderChange: setFilterGender,
        quickFilter,
        onQuickFilterChange: setQuickFilter,
        sortField,
        sortDir,
        onSort: handleSort,
        hasActiveFilters,
        activeFilterCount,
        onClearFilters: clearFilters,
        viewingDeleted,
        onShowDeletedChange: handleShowDeletedChange,
        canViewDeleted: canDelete,
        viewMode: overlay.viewMode,
        onViewModeChange: overlay.setViewMode,
        shownCount,
        selected,
        onClearSelection: handleClearSelection,
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
        isWorkError,
        isWorkLoading,
        isWorkFetching,
        onRetryWork: handleRetryWork,
        workContacts,
        tableColumns,
        commonDirectoryProps,
        tableProps,
        useServerWork,
        workPageData,
        onPageChange: setListPage,
        canWrite,
      },
      setupTierProps: {
        canWrite,
        canEditSetup,
        onImport: actions.handleImport,
      },
    }),
    [
      effectiveTab,
      search,
      setSearch,
      filterGender,
      setFilterGender,
      quickFilter,
      setQuickFilter,
      sortField,
      sortDir,
      handleSort,
      hasActiveFilters,
      activeFilterCount,
      clearFilters,
      viewingDeleted,
      handleShowDeletedChange,
      canDelete,
      overlay.viewMode,
      overlay.setViewMode,
      shownCount,
      selected,
      handleClearSelection,
      selectedTargets,
      bulkActions,
      messaging.canWriteMessaging,
      canExport,
      messaging.handleWhatsApp,
      messaging.handleSms,
      messaging.handleEmail,
      handleBulkExport,
      actions.requestBulkDelete,
      actions.requestBulkRestore,
      actions.handleBulkTag,
      actions.handleImport,
      isWorkError,
      isWorkLoading,
      isWorkFetching,
      handleRetryWork,
      workContacts,
      tableColumns,
      commonDirectoryProps,
      tableProps,
      useServerWork,
      workPageData,
      setListPage,
      canWrite,
      canEditSetup,
    ],
  );
}
