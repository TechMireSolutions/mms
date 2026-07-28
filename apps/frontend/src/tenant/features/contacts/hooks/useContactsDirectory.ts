import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { Contact, ContactsQuickFilter } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import {
  CONTACTS_WORK_DRILLDOWN_EVENT,
  consumeContactsWorkDrillDown,
  type ContactsWorkDrillDown,
} from "@/lib/contacts/contactsWorkDrillDown";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import {
  useContactsCollectionState,
  useContactsPaginated,
  useContactsByIds,
} from "@/tenant/features/contacts/hooks/useContacts";

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
  const [showDeletedArchives, setShowDeletedArchives] = useState(initialShowDeletedArchives);
  const [listPage, setListPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [filterGender, setFilterGender] = useState("");
  const [quickFilter, setQuickFilter] = useState<ContactsQuickFilter>("all");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<(string | number)[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterGender, quickFilter, sortField, sortDir, showDeletedArchives]);

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
    page: listPage,
    limit: workLimit,
    search: debouncedSearch,
    gender: filterGender,
    includeDeleted: showDeletedArchives,
    sortField,
    sortDir,
    quickFilter,
    enabled: useServerWork,
  });

  const contacts = useMemo(() => rawContacts || [], [rawContacts]);
  const workContacts = workPageData?.contacts ?? [];
  const shownCount = workPageData?.total ?? 0;
  const workTruncated = useServerWork && Boolean(workPageData?.hasMore);

  const applyDrillDown = useCallback(
    (filter: ContactsWorkDrillDown) => {
      if (filter.gender) setFilterGender(filter.gender);
      if (filter.search) setSearch(filter.search);
      setActiveTab("work");
    },
    [setActiveTab],
  );

  useEffect(() => {
    const pending = consumeContactsWorkDrillDown();
    if (pending) applyDrillDown(pending);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ContactsWorkDrillDown>).detail;
      if (detail) applyDrillDown(detail);
    };
    window.addEventListener(CONTACTS_WORK_DRILLDOWN_EVENT, handler);
    return () => window.removeEventListener(CONTACTS_WORK_DRILLDOWN_EVENT, handler);
  }, [applyDrillDown]);

  const linkSourceContacts = useMemo(() => {
    const rows = [...workContacts];
    if (editContact) rows.push(editContact);
    if (viewContact) rows.push(viewContact);
    return rows;
  }, [workContacts, editContact, viewContact]);

  const linkedContactIds = useMemo(
    () => collectLinkedContactIds(linkSourceContacts),
    [linkSourceContacts],
  );

  const { data: resolvedLinkContacts = [] } = useContactsByIds(
    needsFullContactsList ? [] : linkedContactIds,
  );

  const allContactsForLinks = useMemo(() => {
    if (needsFullContactsList) return contacts;
    return mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts);
  }, [needsFullContactsList, contacts, linkSourceContacts, resolvedLinkContacts]);

  const hasActiveFilters = !!(filterGender || search || quickFilter !== "all");
  const activeFilterCount = (filterGender ? 1 : 0) + (quickFilter !== "all" ? 1 : 0);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const handleSelect = useCallback(
    (id: string | number) =>
      setSelected((selectedIds) =>
        selectedIds.includes(id)
          ? selectedIds.filter((selectedId) => selectedId !== id)
          : [...selectedIds, id],
      ),
    [],
  );

  const handleSelectAll = useCallback(
    () =>
      setSelected((selectedIds) =>
        selectedIds.length === workContacts.length ? [] : workContacts.map((contact) => contact.id),
      ),
    [workContacts],
  );

  const clearFilters = useCallback(() => {
    setFilterGender("");
    setSearch("");
    setQuickFilter("all");
  }, []);

  return {
    showDeletedArchives,
    setShowDeletedArchives,
    listPage,
    setListPage,
    search,
    setSearch,
    debouncedSearch,
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
  };
}
