import { useContactsPageDirectoryProps } from "@/tenant/features/contacts/hooks/useContactsPageDirectoryProps";
import { useContactsPageTabPanelProps } from "@/tenant/features/contacts/hooks/useContactsPageTabPanelProps";
import { useContactsPageOverlayProps } from "@/tenant/features/contacts/hooks/useContactsPageOverlayProps";
import type { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";

type ContactsPageState = ReturnType<typeof useContactsPageState>;

/** Builds directory/tab/overlay prop bundles from page state + permissions. */
export function useContactsPagePropBundles({
  state,
  canWrite,
  canDelete,
  canExport,
  canEditSetup,
  bulkActions,
  tableColumns,
}: {
  state: ContactsPageState;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canEditSetup: boolean;
  bulkActions: readonly string[];
  tableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
}) {
  const viewingDeleted = state.showDeletedArchives;

  const { messagingHandlers, commonDirectoryProps, tableProps } = useContactsPageDirectoryProps({
    workContacts: state.workContacts,
    selected: state.selected,
    handleSelect: state.handleSelect,
    handleSelectAll: state.handleSelectAll,
    setViewContact: state.setViewContact,
    handleEdit: state.handleEdit,
    handleDelete: state.handleDelete,
    handleRestore: state.handleRestore,
    viewingDeleted,
    canWriteMessaging: state.canWriteMessaging,
    handleWhatsApp: state.handleWhatsApp,
    handleSms: state.handleSms,
    handleEmail: state.handleEmail,
    allContactsForLinks: state.allContactsForLinks,
    canWrite,
    canDelete,
    tableColumns,
    sortField: state.sortField,
    sortDir: state.sortDir,
    handleSort: state.handleSort,
  });

  const tabPanelProps = useContactsPageTabPanelProps({
    effectiveTab: state.effectiveTab,
    search: state.search,
    setSearch: state.setSearch,
    filterGender: state.filterGender,
    setFilterGender: state.setFilterGender,
    quickFilter: state.quickFilter,
    setQuickFilter: state.setQuickFilter,
    sortField: state.sortField,
    sortDir: state.sortDir,
    handleSort: state.handleSort,
    hasActiveFilters: state.hasActiveFilters,
    activeFilterCount: state.activeFilterCount,
    clearFilters: state.clearFilters,
    viewingDeleted,
    setShowDeletedArchives: state.setShowDeletedArchives,
    setSelected: state.setSelected,
    canDelete,
    viewMode: state.viewMode,
    setViewMode: state.setViewMode,
    shownCount: state.shownCount,
    selected: state.selected,
    selectedTargets: state.selectedTargets,
    bulkActions,
    canWriteMessaging: state.canWriteMessaging,
    canExport,
    handleWhatsApp: state.handleWhatsApp,
    handleSms: state.handleSms,
    handleBulkExport: state.handleBulkExport,
    requestBulkDelete: state.requestBulkDelete,
    requestBulkRestore: state.requestBulkRestore,
    isWorkError: state.isWorkError,
    isWorkLoading: state.isWorkLoading,
    isWorkFetching: state.isWorkFetching,
    refetchWork: state.refetchWork,
    workContacts: state.workContacts,
    tableColumns,
    commonDirectoryProps,
    tableProps,
    useServerWork: state.useServerWork,
    workPageData: state.workPageData,
    setListPage: state.setListPage,
    canWrite,
    canEditSetup,
    handleImport: state.handleImport,
  });

  const overlayProps = useContactsPageOverlayProps({
    canWrite,
    canDelete,
    showForm: state.showForm,
    editContact: state.editContact,
    defaultCountry: state.defaultCountry,
    defaultCity: state.defaultCity,
    defaultProvince: state.defaultProvince,
    setShowForm: state.setShowForm,
    setEditContact: state.setEditContact,
    handleSave: state.handleSave,
    showDuplicates: state.showDuplicates,
    setShowDuplicates: state.setShowDuplicates,
    handleMerge: state.handleMerge,
    messagingTarget: state.messagingTarget,
    closeComposer: state.closeComposer,
    viewContact: state.viewContact,
    setViewContact: state.setViewContact,
    handleEdit: state.handleEdit,
    handleRestore: state.handleRestore,
    messagingHandlers,
    allContactsForLinks: state.allContactsForLinks,
    handleUpdateContact: state.handleUpdateContact,
    bulkDeleteOpen: state.bulkDeleteOpen,
    setBulkDeleteOpen: state.setBulkDeleteOpen,
    selectedCount: state.selected.length,
    confirmBulkDelete: state.confirmBulkDelete,
    deleteTarget: state.deleteTarget,
    setDeleteTarget: state.setDeleteTarget,
    confirmSingleDelete: state.confirmSingleDelete,
    bulkRestoreOpen: state.bulkRestoreOpen,
    setBulkRestoreOpen: state.setBulkRestoreOpen,
    confirmBulkRestore: state.confirmBulkRestore,
  });

  return { tabPanelProps, overlayProps };
}
