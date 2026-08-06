import { useModuleWorkKeyboardShortcuts } from "@/hooks/useModuleWorkKeyboardShortcuts";

/** Stable id for Contacts Work search — used by `/` / Cmd+K focus shortcut. */
export const CONTACTS_WORK_SEARCH_INPUT_ID = "contacts-work-search";

/** Contacts Work keyboard shortcuts — thin adapter over the shared Work hook. */
export function useContactsKeyboardShortcuts({
  selectedCount,
  hasActiveFilters,
  clearFilters,
  clearSelection,
  canWrite,
  showDeletedArchives,
  onCreate,
}: {
  selectedCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  clearSelection: () => void;
  canWrite: boolean;
  showDeletedArchives: boolean;
  onCreate: () => void;
}): void {
  useModuleWorkKeyboardShortcuts({
    searchInputId: CONTACTS_WORK_SEARCH_INPUT_ID,
    selectedCount,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted: showDeletedArchives,
    onCreate,
  });
}
