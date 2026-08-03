import type { ComponentProps } from "react";
import type { ContactsQuickFilter, Contact } from "@mms/shared";
import type { ContactsPageTabPanelProps } from "@/tenant/features/contacts/components/ContactsPageTabPanel";
import type { ContactsWorkViewMode } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";
import type ContactCards from "@/tenant/features/contacts/components/ContactCards";
import type ContactsTable from "@/tenant/features/contacts/components/ContactsTable";

type DirectoryColumn = { id: string; label: string; sortField?: string; width?: number };

/** Page-state aliases mapped into ContactsPageTabPanelProps. */
export type UseContactsPageTabPanelPropsInput = {
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
  viewMode: ContactsWorkViewMode;
  setViewMode: (mode: ContactsWorkViewMode) => void;
  shownCount: number;
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
  handleBulkExport: () => void | Promise<void>;
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
  canWrite: boolean;
  canEditSetup: boolean;
  handleImport: (list: Contact[]) => void | Promise<void>;
};

export function buildContactsPageTabPanelProps(
  input: UseContactsPageTabPanelPropsInput,
): ContactsPageTabPanelProps {
  return {
    effectiveTab: input.effectiveTab,
    search: input.search,
    onSearchChange: input.setSearch,
    filterGender: input.filterGender,
    onGenderChange: input.setFilterGender,
    quickFilter: input.quickFilter,
    onQuickFilterChange: input.setQuickFilter,
    sortField: input.sortField,
    sortDir: input.sortDir,
    onSort: input.handleSort,
    hasActiveFilters: input.hasActiveFilters,
    activeFilterCount: input.activeFilterCount,
    onClearFilters: input.clearFilters,
    viewingDeleted: input.viewingDeleted,
    onShowDeletedChange: (next: boolean) => {
      input.setShowDeletedArchives(next);
      input.setSelected([]);
    },
    canViewDeleted: input.canDelete,
    viewMode: input.viewMode,
    onViewModeChange: input.setViewMode,
    shownCount: input.shownCount,
    selected: input.selected,
    onClearSelection: () => input.setSelected([]),
    selectedTargets: input.selectedTargets,
    bulkActions: input.bulkActions,
    canWriteMessaging: input.canWriteMessaging,
    canExport: input.canExport,
    canDelete: input.canDelete,
    onWhatsApp: input.handleWhatsApp,
    onSms: input.handleSms,
    onBulkExport: input.handleBulkExport,
    onRequestBulkDelete: input.requestBulkDelete,
    onRequestBulkRestore: input.requestBulkRestore,
    isWorkError: input.isWorkError,
    isWorkLoading: input.isWorkLoading,
    isWorkFetching: input.isWorkFetching,
    onRetryWork: () => {
      void input.refetchWork();
    },
    workContacts: input.workContacts,
    tableColumns: input.tableColumns,
    commonDirectoryProps: input.commonDirectoryProps,
    tableProps: input.tableProps,
    useServerWork: input.useServerWork,
    workPageData: input.workPageData,
    onPageChange: input.setListPage,
    canWrite: input.canWrite,
    canEditSetup: input.canEditSetup,
    onImport: input.handleImport,
  };
}
