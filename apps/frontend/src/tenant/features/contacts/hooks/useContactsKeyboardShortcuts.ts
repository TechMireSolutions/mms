import { useEffect } from "react";

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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !isInputActive) {
        event.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
        );
        searchInput?.focus();
        searchInput?.select();
      } else if (event.key === "Escape") {
        if (selectedCount > 0) {
          clearSelection();
        } else if (hasActiveFilters) {
          clearFilters();
        }
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "n" &&
        !isInputActive &&
        canWrite &&
        !showDeletedArchives
      ) {
        event.preventDefault();
        onCreate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCount,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeletedArchives,
    onCreate,
  ]);
}
