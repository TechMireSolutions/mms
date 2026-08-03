import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { resolveModuleTierTab } from "@mms/shared";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";
import { useContactsConflictPanel } from "@/tenant/features/contacts/hooks/useContactsConflictPanel";
import { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import { useContactsExportActions } from "@/tenant/features/contacts/hooks/useContactsExportActions";
import { useContactsMessagingActions } from "@/tenant/features/contacts/hooks/useContactsMessagingActions";
import { useContactsKeyboardShortcuts } from "@/tenant/features/contacts/hooks/useContactsKeyboardShortcuts";
import { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import { useContactsPageOverlayState } from "@/tenant/features/contacts/hooks/useContactsPageOverlayState";
import { useContactsSelectionTargets } from "@/tenant/features/contacts/hooks/useContactsSelectionTargets";
import { buildContactsPageStateReturn } from "@/tenant/features/contacts/hooks/buildContactsPageStateReturn";

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

  const overlay = useContactsPageOverlayState();
  const { pendingCount, conflictCount, flushing, flush, openConflictReview } =
    useContactsConflictPanel(overlay.setConflictPanelOpen);

  const messaging = useContactsMessagingActions();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("contacts_active_tab", "work");
  const effectiveTab = resolveModuleTierTab(activeTab, visibleTopTabs.map((tab) => tab.id));

  const directory = useContactsDirectory({
    effectiveTab,
    setActiveTab,
    editContact: overlay.editContact,
    viewContact: overlay.viewContact,
    initialShowDeletedArchives,
  });

  const actions = useContactsPageActions({
    canWrite,
    canDelete,
    workContacts: directory.workContacts,
    linkContacts: directory.allContactsForLinks,
    selected: directory.selected,
    setSelected: directory.setSelected,
    shownCount: directory.shownCount,
    editContact: overlay.editContact,
    setEditContact: overlay.setEditContact,
    setShowForm: overlay.setShowForm,
    setShowDuplicates: overlay.setShowDuplicates,
    openingDuplicates: overlay.openingDuplicates,
    setOpeningDuplicates: overlay.setOpeningDuplicates,
    deleteTarget: overlay.deleteTarget,
    setDeleteTarget: overlay.setDeleteTarget,
    setBulkDeleteOpen: overlay.setBulkDeleteOpen,
    setBulkRestoreOpen: overlay.setBulkRestoreOpen,
    crud,
  });

  const { handleExportCSV, handleBulkExport } = useContactsExportActions({
    tableColumns,
    canExport,
    search: directory.search,
    filterGender: directory.filterGender,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    quickFilter: directory.quickFilter,
    showDeletedArchives: directory.showDeletedArchives,
    workContacts: directory.workContacts,
    selected: directory.selected,
    logExportAudit,
    handleError,
    t,
  });

  const selectedTargets = useContactsSelectionTargets({
    selected: directory.selected,
    workContacts: directory.workContacts,
  });

  useContactsKeyboardShortcuts({
    selectedCount: directory.selected.length,
    hasActiveFilters: directory.hasActiveFilters,
    clearFilters: directory.clearFilters,
    clearSelection: () => directory.setSelected([]),
    canWrite,
    showDeletedArchives: directory.showDeletedArchives,
    onCreate: actions.handleCreateContact,
  });

  return buildContactsPageStateReturn({
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
  });
}
