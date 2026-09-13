/**
 * @file useTemplateEditorShortcuts.ts
 * @description Hook managing keyboard shortcut bindings for undo/redo, delete, duplicate, nudge, and selection.
 * Uses React 19 useEffectEvent for a single stable window listener that always reads current values.
 */

import { useEffect, useEffectEvent } from "react";

export interface UseTemplateEditorShortcutsOptions {
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  hasSelection: boolean;
}

export function useTemplateEditorShortcuts({
  undo,
  redo,
  selectAll,
  deselectAll,
  duplicateSelected,
  deleteSelected,
  nudgeSelected,
  hasSelection,
}: UseTemplateEditorShortcutsOptions): void {
  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "SELECT")
    ) {
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      selectAll();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicateSelected();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      deselectAll();
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (hasSelection) {
        e.preventDefault();
        deleteSelected();
      }
      return;
    }

    const step = e.shiftKey ? 8 : 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudgeSelected(-step, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudgeSelected(step, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nudgeSelected(0, -step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudgeSelected(0, step);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
