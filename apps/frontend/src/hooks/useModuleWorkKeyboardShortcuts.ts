import { useEffect } from "react";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";

export interface UseModuleWorkKeyboardShortcutsOptions {
  /** Stable DOM id of the Work SearchBar input. */
  searchInputId: string;
  selectedCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  clearSelection: () => void;
  canWrite: boolean;
  showDeleted: boolean;
  onCreate: () => void;
}

/**
 * Shared Work keyboard shortcuts: focus search (`/` / Cmd+K), Escape clears
 * selection then filters, Cmd/Ctrl+N creates when writable and not in trash.
 */
export function useModuleWorkKeyboardShortcuts({
  searchInputId,
  selectedCount,
  hasActiveFilters,
  clearFilters,
  clearSelection,
  canWrite,
  showDeleted,
  onCreate,
}: UseModuleWorkKeyboardShortcutsOptions): void {
  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        (event.key === "/" ||
          (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) &&
        !isInputActive
      ) {
        event.preventDefault();
        const searchInput = document.getElementById(searchInputId) as HTMLInputElement | null;
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
  }, [searchInputId, selectedCount, hasActiveFilters, clearFilters, clearSelection]);
}
