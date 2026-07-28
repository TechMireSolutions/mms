import { useMemo, type ComponentProps } from "react";
import type { ContactsQuickFilter, Contact } from "@mms/shared";
import type { ContactsPageTabPanelProps } from "@/tenant/features/contacts/components/ContactsPageTabPanel";
import type ContactCards from "@/tenant/features/contacts/components/ContactCards";
import type ContactsTable from "@/tenant/features/contacts/components/ContactsTable";

type ViewMode = "table" | "cards" | null;
type DirectoryColumn = { id: string; label: string; sortField?: string; width?: number };

export function useContactsPageTabPanelProps({
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
  setShowDeletedArchives,
  setSelected,
  canDelete,
  viewModeOverride,
  setViewModeOverride,
  shownCount,
  workTruncated,
  selected,
  selectedTargets,
  bulkActions,
  canWriteMessaging,
  canExport,
  handleWhatsApp,
  handleSms,
  handleBulkExport,
  requestBulkDelete,
  requestBulkRestore,
  isWorkError,
  isWorkLoading,
  isWorkFetching,
  refetchWork,
  workContacts,
  tableColumns,
  commonDirectoryProps,
  tableProps,
  useServerWork,
  workPageData,
  setListPage,
  contacts,
  canWrite,
  canEditSetup,
  handleImport,
}: {
  effectiveTab: string;
  search: string;
  setSearch: (value: string) => void;
  filterGender: string;
  setFilterGender: (value: string) => void;
  quickFilter: ContactsQuickFilter;
  setQuickFilter: (value: ContactsQuickFilter) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  handleSort: (field: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
  viewingDeleted: boolean;
  setShowDeletedArchives: (next: boolean) => void;
  setSelected: (ids: Array<string | number>) => void;
  canDelete: boolean;
  viewModeOverride: ViewMode;
  setViewModeOverride: (mode: Exclude<ViewMode, null>) => void;
  shownCount: number;
  workTruncated: boolean;
  selected: Array<string | number>;
  selectedTargets: {
    waTargets: Contact[];
    smsReady: Contact[];
  };
  bulkActions: readonly string[];
  canWriteMessaging: boolean;
  canExport: boolean;
  handleWhatsApp: (targets: Contact[]) => void;
  handleSms: (targets: Contact[]) => void;
  handleBulkExport: () => void;
  requestBulkDelete: () => void;
  requestBulkRestore: () => void;
  isWorkError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  refetchWork: () => Promise<unknown>;
  workContacts: Contact[];
  tableColumns: DirectoryColumn[];
  commonDirectoryProps: ComponentProps<typeof ContactCards>;
  tableProps: ComponentProps<typeof ContactsTable>;
  useServerWork: boolean;
  workPageData?: { page: number; total: number; limit: number; hasMore: boolean } | null;
  setListPage: (page: number) => void;
  contacts: Contact[];
  canWrite: boolean;
  canEditSetup: boolean;
  handleImport: (list: Contact[]) => void | Promise<void>;
}): ContactsPageTabPanelProps {
  return useMemo(
    () => ({
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
      onShowDeletedChange: (next: boolean) => {
        setShowDeletedArchives(next);
        setSelected([]);
      },
      canViewDeleted: canDelete,
      viewModeOverride,
      onViewModeChange: setViewModeOverride,
      shownCount,
      workTruncated,
      selected,
      onClearSelection: () => setSelected([]),
      selectedTargets,
      bulkActions,
      canWriteMessaging,
      canExport,
      canDelete,
      onWhatsApp: handleWhatsApp,
      onSms: handleSms,
      onBulkExport: handleBulkExport,
      onRequestBulkDelete: requestBulkDelete,
      onRequestBulkRestore: requestBulkRestore,
      isWorkError,
      isWorkLoading,
      isWorkFetching,
      onRetryWork: () => {
        void refetchWork();
      },
      workContacts,
      tableColumns,
      commonDirectoryProps,
      tableProps,
      useServerWork,
      workPageData,
      onPageChange: setListPage,
      contacts,
      canWrite,
      canEditSetup,
      onImport: handleImport,
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
      setShowDeletedArchives,
      setSelected,
      canDelete,
      viewModeOverride,
      setViewModeOverride,
      shownCount,
      workTruncated,
      selected,
      selectedTargets,
      bulkActions,
      canWriteMessaging,
      canExport,
      handleWhatsApp,
      handleSms,
      handleBulkExport,
      requestBulkDelete,
      requestBulkRestore,
      isWorkError,
      isWorkLoading,
      isWorkFetching,
      refetchWork,
      workContacts,
      tableColumns,
      commonDirectoryProps,
      tableProps,
      useServerWork,
      workPageData,
      setListPage,
      contacts,
      canWrite,
      canEditSetup,
      handleImport,
    ],
  );
}
