import type { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import type { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";
import type { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import type { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import type { useContactsSelectionTargets } from "@/tenant/features/contacts/hooks/useContactsSelectionTargets";
import type { useTranslation } from "@/hooks/useTranslation";
import type { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";

type Directory = ReturnType<typeof useContactsDirectory>;
type Overlay = ReturnType<typeof useContactsPageOverlayState>;
type Messaging = ReturnType<typeof useContactsMessagingActions>;
type Actions = ReturnType<typeof useContactsPageActions>;
type SelectedTargets = ReturnType<typeof useContactsSelectionTargets>;

/**
 * Remaps Contacts page state slices into the flat object ContactsPage consumes.
 * Keeps `handleCreateContact` exposed as `handleNew` for existing callers.
 */
export function buildContactsPageStateReturn({
  t,
  visibleTopTabs,
  effectiveTab,
  activeTab,
  setActiveTab,
  directory,
  overlay,
  messaging,
  actions,
  handleExportCSV,
  handleBulkExport,
  selectedTargets,
  prefs,
  openConflictReview,
  pendingCount,
  conflictCount,
  flushing,
  flush,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  visibleTopTabs: ReturnType<typeof useFilteredModuleTierTabs>;
  effectiveTab: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  directory: Directory;
  overlay: Overlay;
  messaging: Messaging;
  actions: Actions;
  handleExportCSV: () => void;
  handleBulkExport: () => void | Promise<void>;
  selectedTargets: SelectedTargets;
  prefs: {
    defaultCountry?: string;
    defaultCity?: string;
    defaultProvince?: string;
  };
  openConflictReview: () => void;
  pendingCount: number;
  conflictCount: number;
  flushing: boolean;
  flush: () => unknown;
}) {
  return {
    t,
    visibleTopTabs,
    effectiveTab,
    activeTab,
    setActiveTab,
    search: directory.search,
    setSearch: directory.setSearch,
    filterGender: directory.filterGender,
    setFilterGender: directory.setFilterGender,
    quickFilter: directory.quickFilter,
    setQuickFilter: directory.setQuickFilter,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    selected: directory.selected,
    setSelected: directory.setSelected,
    showForm: overlay.showForm,
    setShowForm: overlay.setShowForm,
    editContact: overlay.editContact,
    setEditContact: overlay.setEditContact,
    viewContact: overlay.viewContact,
    setViewContact: overlay.setViewContact,
    showDuplicates: overlay.showDuplicates,
    setShowDuplicates: overlay.setShowDuplicates,
    messagingTarget: messaging.messagingTarget,
    closeComposer: messaging.closeComposer,
    handleWhatsApp: messaging.handleWhatsApp,
    handleSms: messaging.handleSms,
    handleEmail: messaging.handleEmail,
    canWriteMessaging: messaging.canWriteMessaging,
    hasActiveFilters: directory.hasActiveFilters,
    activeFilterCount: directory.activeFilterCount,
    defaultCountry: prefs.defaultCountry || "",
    defaultCity: prefs.defaultCity || "",
    defaultProvince: prefs.defaultProvince || "",
    handleSort: directory.handleSort,
    handleSelect: directory.handleSelect,
    handleSelectAll: directory.handleSelectAll,
    handleNew: actions.handleCreateContact,
    handleEdit: actions.handleEdit,
    handleSave: actions.handleSave,
    handleDelete: actions.handleDelete,
    confirmSingleDelete: actions.confirmSingleDelete,
    deleteTarget: overlay.deleteTarget,
    setDeleteTarget: overlay.setDeleteTarget,
    handleUpdateContact: actions.handleUpdateContact,
    handleExportCSV,
    handleBulkExport,
    requestBulkDelete: actions.requestBulkDelete,
    confirmBulkDelete: actions.confirmBulkDelete,
    bulkDeleteOpen: overlay.bulkDeleteOpen,
    setBulkDeleteOpen: overlay.setBulkDeleteOpen,
    requestBulkRestore: actions.requestBulkRestore,
    confirmBulkRestore: actions.confirmBulkRestore,
    bulkRestoreOpen: overlay.bulkRestoreOpen,
    setBulkRestoreOpen: overlay.setBulkRestoreOpen,
    clearFilters: directory.clearFilters,
    handleImport: actions.handleImport,
    handleMerge: actions.handleMerge,
    handleRestore: actions.handleRestore,
    viewMode: overlay.viewMode,
    setViewMode: overlay.setViewMode,
    conflictPanelOpen: overlay.conflictPanelOpen,
    setConflictPanelOpen: overlay.setConflictPanelOpen,
    openConflictReview,
    openingDuplicates: overlay.openingDuplicates,
    handleOpenDuplicates: actions.handleOpenDuplicates,
    showDeletedArchives: directory.showDeletedArchives,
    setShowDeletedArchives: directory.setShowDeletedArchives,
    useServerWork: directory.useServerWork,
    workPageData: directory.workPageData,
    isWorkLoading: directory.isWorkLoading,
    isWorkError: directory.isWorkError,
    refetchWork: directory.refetchWork,
    isWorkFetching: directory.isWorkFetching,
    listPage: directory.listPage,
    setListPage: directory.setListPage,
    workContacts: directory.workContacts,
    allContactsForLinks: directory.allContactsForLinks,
    selectedTargets,
    shownCount: directory.shownCount,
    pendingCount,
    conflictCount,
    flushing,
    flush,
  };
}
