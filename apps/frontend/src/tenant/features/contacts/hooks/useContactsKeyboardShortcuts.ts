import { useEffect } from "react";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";

/** Stable id for Contacts Work search — used by `/` / Cmd+K focus shortcut. */
export const CONTACTS_WORK_SEARCH_INPUT_ID = "contacts-work-search";

/** Contacts Work keyboard shortcuts: focus search, clear selection/filters, Cmd/Ctrl+N create. */
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
}) {
  useModuleCreateHotkey({
    enabled: canWrite && !showDeletedArchives,
    onCreate,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !isInputActive) {
        event.preventDefault();
        const searchInput = document.getElementById(
          CONTACTS_WORK_SEARCH_INPUT_ID,
        ) as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      } else if (event.key === "Escape") {
        if (selectedCount > 0) {
          clearSelection();
        } else if (hasActiveFilters) {
          clearFilters();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCount, hasActiveFilters, clearFilters, clearSelection]);
}
