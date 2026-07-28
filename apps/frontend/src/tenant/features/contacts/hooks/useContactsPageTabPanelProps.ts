import { useMemo } from "react";
import type { ContactsPageTabPanelProps } from "@/tenant/features/contacts/components/ContactsPageTabPanel";
import {
  buildContactsPageTabPanelProps,
  type UseContactsPageTabPanelPropsInput,
} from "@/tenant/features/contacts/hooks/buildContactsPageTabPanelProps";

export type { UseContactsPageTabPanelPropsInput } from "@/tenant/features/contacts/hooks/buildContactsPageTabPanelProps";
export { buildContactsPageTabPanelProps } from "@/tenant/features/contacts/hooks/buildContactsPageTabPanelProps";

export function useContactsPageTabPanelProps(
  input: UseContactsPageTabPanelPropsInput,
): ContactsPageTabPanelProps {
  return useMemo(
    () => buildContactsPageTabPanelProps(input),
    [
      input.effectiveTab,
      input.search,
      input.setSearch,
      input.filterGender,
      input.setFilterGender,
      input.quickFilter,
      input.setQuickFilter,
      input.sortField,
      input.sortDir,
      input.handleSort,
      input.hasActiveFilters,
      input.activeFilterCount,
      input.clearFilters,
      input.viewingDeleted,
      input.setShowDeletedArchives,
      input.setSelected,
      input.canDelete,
      input.viewModeOverride,
      input.setViewModeOverride,
      input.shownCount,
      input.workTruncated,
      input.selected,
      input.selectedTargets,
      input.bulkActions,
      input.canWriteMessaging,
      input.canExport,
      input.handleWhatsApp,
      input.handleSms,
      input.handleBulkExport,
      input.requestBulkDelete,
      input.requestBulkRestore,
      input.isWorkError,
      input.isWorkLoading,
      input.isWorkFetching,
      input.refetchWork,
      input.workContacts,
      input.tableColumns,
      input.commonDirectoryProps,
      input.tableProps,
      input.useServerWork,
      input.workPageData,
      input.setListPage,
      input.contacts,
      input.canWrite,
      input.canEditSetup,
      input.handleImport,
    ],
  );
}
