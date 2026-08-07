import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { isContactsQuickFilter, type ContactsQuickFilter } from "@mms/shared";
import {
  CONTACTS_WORK_DRILLDOWN_EVENT,
  consumeContactsWorkDrillDown,
  type ContactsWorkDrillDown,
} from "@/lib/contacts/contactsWorkDrillDown";
import { toggleIdInSelection, togglePageIdsInSelection } from "@/lib/directorySelection";

export function useContactsDirectoryFilters({
  setActiveTab,
  initialViewingDeleted = false,
}: {
  setActiveTab: (tab: string) => void;
  initialViewingDeleted?: boolean;
}) {
  const [viewingDeleted, setViewingDeleted] = useState(initialViewingDeleted);
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
  }, [debouncedSearch, filterGender, quickFilter, sortField, sortDir, viewingDeleted]);

  const applyDrillDown = useCallback(
    (filter: ContactsWorkDrillDown) => {
      if (filter.gender) setFilterGender(filter.gender);
      if (filter.search) setSearch(filter.search);
      if (filter.quickFilter && isContactsQuickFilter(filter.quickFilter)) {
        setQuickFilter(filter.quickFilter);
      }
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

  const hasActiveFilters = !!(filterGender || search || quickFilter !== "all");
  const activeFilterCount =
    (filterGender ? 1 : 0) + (quickFilter !== "all" ? 1 : 0) + (search.trim() ? 1 : 0);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const handleSelect = useCallback((id: string | number) => {
    setSelected((selectedIds) => toggleIdInSelection(selectedIds, id));
  }, []);

  /** Toggle current-page ids into/out of selection (keeps selections from other pages). */
  const handleSelectAll = useCallback((workContactIds: Array<string | number>) => {
    setSelected((selectedIds) => togglePageIdsInSelection(selectedIds, workContactIds));
  }, []);
  const clearFilters = useCallback(() => {
    setFilterGender("");
    setSearch("");
    setQuickFilter("all");
  }, []);

  return {
    viewingDeleted,
    setViewingDeleted,
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
    hasActiveFilters,
    activeFilterCount,
    handleSort,
    handleSelect,
    handleSelectAll,
    clearFilters,
  };
}
