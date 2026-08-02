import { useCallback } from "react";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";
import { useContactsPagePropBundles } from "@/tenant/features/contacts/hooks/useContactsPagePropBundles";
import { useContactConfig, useContactColumns } from "@/lib/contexts/ContactConfigContext";
import { useGoogleContactsOAuthListener } from "@/lib/contacts/googleContactsOAuthListener";

/** Composes Contacts page state + directory/tab/overlay prop bundles. */
export function useContactsPageView() {
  const {
    canRead,
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(CONTACTS_MODULE_MANIFEST);
  const bulkActions = CONTACTS_MODULE_MANIFEST.work.bulkActions;
  const { prefs } = useContactConfig();
  const tableColumns = useContactColumns();

  const state = useContactsPageState({
    prefs,
    tableColumns,
    canWrite,
    canDelete,
    canExport,
    canViewReports,
    canViewSetup,
  });

  useGoogleContactsOAuthListener(
    useCallback(() => {
      state.setActiveTab("setup");
    }, [state.setActiveTab]),
  );

  const { tabPanelProps, overlayProps } = useContactsPagePropBundles({
    state,
    canWrite,
    canDelete,
    canExport,
    canEditSetup,
    bulkActions,
    tableColumns,
  });

  return {
    t: state.t,
    visibleTopTabs: state.visibleTopTabs,
    effectiveTab: state.effectiveTab,
    setActiveTab: state.setActiveTab,
    canExport,
    canRead,
    canWrite,
    viewingDeleted: state.showDeletedArchives,
    openingDuplicates: state.openingDuplicates,
    handleOpenDuplicates: state.handleOpenDuplicates,
    handleExportCSV: state.handleExportCSV,
    handleNew: state.handleNew,
    shownCount: state.shownCount,
    pendingCount: state.pendingCount,
    conflictCount: state.conflictCount,
    flushing: state.flushing,
    flush: state.flush,
    openConflictReview: state.openConflictReview,
    needsFullContactsList: state.needsFullContactsList,
    conflictPanelOpen: state.conflictPanelOpen,
    setConflictPanelOpen: state.setConflictPanelOpen,
    tabPanelProps,
    overlayProps,
  };
}
