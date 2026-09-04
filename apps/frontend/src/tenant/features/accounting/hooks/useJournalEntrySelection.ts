import { useState, type Dispatch, type SetStateAction } from 'react';
import type { JournalEntry } from '@/lib/data/accountingData';

/** Work directory row selection SSOT for journal entries (Obligations-shaped). */
export function useJournalEntrySelection(entries: JournalEntry[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = entries.length > 0
    && entries.every((entry) => selectedSet.has(entry.id));
  const someVisibleSelected = selectedSet.size > 0 && entries.some((entry) => selectedSet.has(entry.id));

  const toggleSelectAll = ((checked: boolean) => {
    const visibleIds = entries.map((entry) => entry.id);
    const visibleSet = new Set(visibleIds);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleSet.has(id)));
  });

  const toggleSelectedEntry = ((id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  });

  const clearSelection = (() => setSelectedIds([]));

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
