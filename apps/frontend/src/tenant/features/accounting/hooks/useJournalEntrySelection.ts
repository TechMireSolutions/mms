import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { JournalEntry } from '@/lib/data/accountingData';

/** Work directory row selection SSOT for journal entries (Obligations-shaped). */
export function useJournalEntrySelection(entries: JournalEntry[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = entries.length > 0
    && entries.every((entry) => selectedIds.includes(entry.id));
  const someVisibleSelected = entries.some((entry) => selectedIds.includes(entry.id));

  const toggleSelectAll = useCallback((checked: boolean) => {
    const visibleIds = entries.map((entry) => entry.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  }, [entries]);

  const toggleSelectedEntry = useCallback((id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedEntry,
    clearSelection,
  };
}

export type JournalEntrySelection = ReturnType<typeof useJournalEntrySelection>;
export type { Dispatch, SetStateAction };
