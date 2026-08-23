import { useModuleShortcuts } from "@/hooks/useModuleShortcuts";

/** Stable id for Teachers Work search — used by `/` / Cmd+K focus shortcut. */
export const TEACHERS_WORK_SEARCH_INPUT_ID = "teachers-work-search";

/** Teachers Work keyboard shortcuts — thin adapter over the shared Work hook. */
export function useTeachersKeyboardShortcuts({
  selectedCount,
  hasActiveFilters,
  clearFilters,
  clearSelection,
  canWrite,
  showDeleted,
  onCreate,
}: {
  selectedCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  clearSelection: () => void;
  canWrite: boolean;
  showDeleted: boolean;
  onCreate: () => void;
}): void {
  useModuleShortcuts({
    searchInputId: TEACHERS_WORK_SEARCH_INPUT_ID,
    selectedCount,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate,
  });
}
