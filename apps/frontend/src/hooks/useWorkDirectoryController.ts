import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from "@/lib/directorySelection";

export interface UseWorkDirectoryControllerOptions<TSort extends string = string> {
  defaultSortField?: TSort;
  defaultSortDir?: "asc" | "desc";
}

export interface PendingDeleteState {
  id: string | null;
  name?: string;
  open: boolean;
  request: (id: string, name?: string) => void;
  close: () => void;
}

/**
 * Universal Work Directory Controller Hook (SSOT).
 * Unifies search, debounce, pagination, viewMode, sorting, soft-delete toggle,
 * multi-select, and confirmation dialog state for module Work tiers.
 */
export function useWorkDirectoryController<TSort extends string = string>(
  options: UseWorkDirectoryControllerOptions<TSort> = {},
) {
  const { defaultSortField, defaultSortDir = "asc" } = options;
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [page, setPage] = useState(1);
  const [viewingDeleted, setViewingDeleted] = useState(false);
  const [sortField, setSortField] = useState<TSort | undefined>(defaultSortField);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog state for soft-delete & restore
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | undefined>();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);

  // Auto-reset pagination to page 1 on search, sort, or soft-delete toggle
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, viewingDeleted, sortField, sortDir]);

  // Clear selections whenever toggling soft-delete mode or page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [viewingDeleted, page]);

  const handleSort = useCallback((field: TSort) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => toggleIdInSelection(prev, id));
  }, []);

  const handleSelectAll = useCallback((pageIds: string[]) => {
    setSelectedIds((prev) => togglePageIdsInSelection(prev, pageIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleViewingDeleted = useCallback(() => {
    setViewingDeleted((prev) => !prev);
  }, []);

  const requestPendingDelete = useCallback((id: string, name?: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
  }, []);

  const closePendingDelete = useCallback(() => {
    setPendingDeleteId(null);
    setPendingDeleteName(undefined);
  }, []);

  const pendingDelete = useMemo<PendingDeleteState>(
    () => ({
      id: pendingDeleteId,
      name: pendingDeleteName,
      open: pendingDeleteId !== null,
      request: requestPendingDelete,
      close: closePendingDelete,
    }),
    [pendingDeleteId, pendingDeleteName, requestPendingDelete, closePendingDelete],
  );

  const selectionState = useMemo(() => {
    return (pageIds: string[]) => getDirectoryPageSelection(pageIds, selectedIds);
  }, [selectedIds]);

  return {
    // Search
    search,
    debouncedSearch,
    setSearch,
    // Pagination
    page,
    setPage,
    // Sort
    sortField,
    sortDir,
    handleSort,
    setSortField,
    setSortDir,
    // View mode
    viewMode,
    setViewMode,
    // Soft delete
    viewingDeleted,
    setViewingDeleted,
    toggleViewingDeleted,
    // Selection
    selectedIds,
    setSelectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    selectionState,
    // Dialog states
    pendingDelete,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkRestoreOpen,
    setBulkRestoreOpen,
  };
}
