import { useCallback, useEffect, useRef } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import {
  resolveModuleTierTab,
} from "@mms/shared";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import { useContactsExportActions } from "@/tenant/features/contacts/hooks/useContactsExportActions";
import { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import { useContactsKeyboardShortcuts } from "@/tenant/features/contacts/hooks/useContactsKeyboardShortcuts";
import { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";
import { useContactsSelectionTargets } from "@/tenant/features/contacts/hooks/useContactsSelectionTargets";

export interface UseContactsPageStateOptions {
  prefs: {
    defaultCountry?: string;
    defaultCity?: string;
    defaultProvince?: string;
  };
  tableColumns: Array<{ id: string; label: string }>;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewReports: boolean;
  canViewSetup: boolean;
  initialShowDeletedArchives?: boolean;
}

export function useContactsPageState({
  prefs,
  tableColumns,
  canWrite,
  canDelete,
  canExport,
  canViewReports,
  canViewSetup,
  initialShowDeletedArchives = false,
}: UseContactsPageStateOptions) {
  const { t } = useTranslation();
  const crud = useContactsCrudActions();
  const { logExportAudit, handleError } = crud;

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const {
    showForm,
    setShowForm,
    editContact,
    setEditContact,
    viewContact,
    setViewContact,
    showDuplicates,
    setShowDuplicates,
    openingDuplicates,
    setOpeningDuplicates,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkRestoreOpen,
    setBulkRestoreOpen,
    deleteTarget,
    setDeleteTarget,
    viewModeOverride,
    setViewModeOverride,
    conflictPanelOpen,
    setConflictPanelOpen,
  } = useContactsPageOverlayState();

  const { pendingCount, conflictCount, flushing, flush } = useContactsSyncOutbox();
  const prevConflictCount = useRef(conflictCount);
  const openConflictReview = useCallback(() => setConflictPanelOpen(true), [setConflictPanelOpen]);

  useEffect(() => {
    if (prevConflictCount.current === 0 && conflictCount > 0) {
      setConflictPanelOpen(true);
    }
    prevConflictCount.current = conflictCount;
  }, [conflictCount, setConflictPanelOpen]);

  const {
    messagingTarget,
    closeComposer,
    canWriteMessaging,
    handleWhatsApp,
    handleSms,
    handleEmail,
  } = useContactsMessagingActions();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("contacts_active_tab", "work");
  const effectiveTab = resolveModuleTierTab(activeTab, visibleTopTabs.map((tab) => tab.id));

  const {
    showDeletedArchives,
    setShowDeletedArchives,
    listPage,
    setListPage,
    search,
    setSearch,
    filterGender,
    setFilterGender,
    quickFilter,
    setQuickFilter,
    sortField,
    sortDir,
    selected,
    setSelected,
    needsFullContactsList,
    useServerWork,
    contacts,
    workPageData,
    isWorkLoading,
    isWorkError,
    refetchWork,
    isWorkFetching,
    workContacts,
    shownCount,
    workTruncated,
    allContactsForLinks,
    hasActiveFilters,
    activeFilterCount,
    handleSort,
    handleSelect,
    handleSelectAll,
    clearFilters,
  } = useContactsDirectory({
    effectiveTab,
    setActiveTab,
    editContact,
    viewContact,
    initialShowDeletedArchives,
  });

  const {
    handleOpenDuplicates,
    handleEdit,
    handleCreateContact,
    handleSave,
    handleDelete,
    confirmSingleDelete,
    handleUpdateContact,
    requestBulkDelete,
    confirmBulkDelete,
    requestBulkRestore,
    confirmBulkRestore,
    handleImport,
    handleMerge,
    handleRestore,
  } = useContactsPageActions({
    canWrite,
    canDelete,
    workContacts,
    contacts,
    selected,
    setSelected,
    shownCount,
    editContact,
    setEditContact,
    setShowForm,
    setShowDuplicates,
    openingDuplicates,
    setOpeningDuplicates,
    deleteTarget,
    setDeleteTarget,
    setBulkDeleteOpen,
    setBulkRestoreOpen,
    crud,
  });

  const { handleExportCSV, handleBulkExport } = useContactsExportActions({
    tableColumns,
    canExport,
    search,
    filterGender,
    sortField,
    sortDir,
    quickFilter,
    showDeletedArchives,
    workContacts,
    selected,
    logExportAudit,
    handleError,
    t,
  });

  const defaultCountry = prefs.defaultCountry || "";
  const defaultCity = prefs.defaultCity || "";
  const defaultProvince = prefs.defaultProvince || "";

  const selectedTargets = useContactsSelectionTargets({ selected, workContacts });

  useContactsKeyboardShortcuts({
    selectedCount: selected.length,
    hasActiveFilters,
    clearFilters,
    clearSelection: () => setSelected([]),
    canWrite,
    showDeletedArchives,
    onCreate: handleCreateContact,
  });

  return {
    t,
    visibleTopTabs,
    effectiveTab,
    activeTab,
    setActiveTab,
    contacts,
    search,
    setSearch,
    filterGender,
    setFilterGender,
    quickFilter,
    setQuickFilter,
    sortField,
    sortDir,
    selected,
    setSelected,
    showForm,
    setShowForm,
    editContact,
    setEditContact,
    viewContact,
    setViewContact,
    showDuplicates,
    setShowDuplicates,
    messagingTarget,
    closeComposer,
    handleWhatsApp,
    handleSms,
    handleEmail,
    canWriteMessaging,
    hasActiveFilters,
    activeFilterCount,
    defaultCountry,
    defaultCity,
    defaultProvince,
    handleSort,
    handleSelect,
    handleSelectAll,
    handleEdit,
    handleNew: handleCreateContact,
    handleSave,
    handleDelete,
    confirmSingleDelete,
    deleteTarget,
    setDeleteTarget,
    handleUpdateContact,
    handleExportCSV,
    handleBulkExport,
    requestBulkDelete,
    confirmBulkDelete,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    requestBulkRestore,
    confirmBulkRestore,
    bulkRestoreOpen,
    setBulkRestoreOpen,
    clearFilters,
    handleImport,
    handleMerge,
    handleRestore,
    viewModeOverride,
    setViewModeOverride,
    conflictPanelOpen,
    setConflictPanelOpen,
    openConflictReview,
    openingDuplicates,
    handleOpenDuplicates,
    showDeletedArchives,
    setShowDeletedArchives,
    needsFullContactsList,
    useServerWork,
    workPageData,
    isWorkLoading,
    isWorkError,
    refetchWork,
    isWorkFetching,
    listPage,
    setListPage,
    workContacts,
    allContactsForLinks,
    selectedTargets,
    shownCount,
    workTruncated,
    pendingCount,
    conflictCount,
    flushing,
    flush,
  };
}
