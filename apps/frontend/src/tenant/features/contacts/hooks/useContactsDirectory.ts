import { useCallback, useMemo } from "react";
import type { Contact } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import {
  useContactsCollectionState,
  useContactsPaginated,
} from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsDirectoryFilters } from "@/tenant/features/contacts/hooks/useContactsDirectoryFilters";
import { useContactsDirectoryLinks } from "@/tenant/features/contacts/hooks/useContactsDirectoryLinks";

export interface UseContactsDirectoryOptions {
  effectiveTab: string;
  setActiveTab: (tab: string) => void;
  editContact: Contact | null;
  viewContact: Contact | null;
  initialShowDeletedArchives?: boolean;
}

export function useContactsDirectory({
  effectiveTab,
  setActiveTab,
  editContact,
  viewContact,
  initialShowDeletedArchives = false,
}: UseContactsDirectoryOptions) {
  const filters = useContactsDirectoryFilters({
    setActiveTab,
    initialShowDeletedArchives,
  });

  const needsFullContactsList = effectiveTab === "setup";
  const useServerWork = effectiveTab === "work";
  const workLimit = CONTACTS_MODULE_MANIFEST.defaultPageSize;

  const { contacts: rawContacts } = useContactsCollectionState({
    enabled: needsFullContactsList,
  });

  const {
    data: workPageData,
    isLoading: isWorkLoading,
    isError: isWorkError,
    refetch: refetchWork,
    isFetching: isWorkFetching,
  } = useContactsPaginated({
    page: filters.listPage,
    limit: workLimit,
    search: filters.debouncedSearch,
    gender: filters.filterGender,
    includeDeleted: filters.showDeletedArchives,
    sortField: filters.sortField,
    sortDir: filters.sortDir,
    quickFilter: filters.quickFilter,
    enabled: useServerWork,
  });

  const contacts = useMemo(() => rawContacts || [], [rawContacts]);
  const workContacts = workPageData?.contacts ?? [];
  const shownCount = workPageData?.total ?? 0;

  const allContactsForLinks = useContactsDirectoryLinks({
    needsFullContactsList,
    contacts,
    workContacts,
    editContact,
    viewContact,
  });

  const { handleSelectAll: selectAllIds } = filters;
  const handleSelectAll = useCallback(() => {
    selectAllIds(workContacts.map((contact) => contact.id));
  }, [selectAllIds, workContacts]);

  return {
    showDeletedArchives: filters.showDeletedArchives,
    setShowDeletedArchives: filters.setShowDeletedArchives,
    listPage: filters.listPage,
    setListPage: filters.setListPage,
    search: filters.search,
    setSearch: filters.setSearch,
    debouncedSearch: filters.debouncedSearch,
    filterGender: filters.filterGender,
    setFilterGender: filters.setFilterGender,
    quickFilter: filters.quickFilter,
    setQuickFilter: filters.setQuickFilter,
    sortField: filters.sortField,
    sortDir: filters.sortDir,
    selected: filters.selected,
    setSelected: filters.setSelected,
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
    allContactsForLinks,
    hasActiveFilters: filters.hasActiveFilters,
    activeFilterCount: filters.activeFilterCount,
    handleSort: filters.handleSort,
    handleSelect: filters.handleSelect,
    handleSelectAll,
    clearFilters: filters.clearFilters,
  };
}
