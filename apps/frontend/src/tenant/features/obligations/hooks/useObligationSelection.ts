import { useState, type Dispatch, type SetStateAction } from 'react';
import type { ObligationCollection } from '@/lib/data/obligationsData';

/** Work directory row selection SSOT for obligation collections (Hasanat-shaped). */
export function useObligationSelection(collections: ObligationCollection[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = collections.length > 0
    && collections.every((collection) => selectedSet.has(collection.id));
  const someVisibleSelected = selectedSet.size > 0 && collections.some((collection) => selectedSet.has(collection.id));

  const toggleSelectAll = ((checked: boolean) => {
    const visibleIds = collections.map((collection) => collection.id);
    const visibleSet = new Set(visibleIds);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleSet.has(id)));
  });

  const toggleSelectedCollection = ((id: string, checked: boolean) => {
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
    toggleSelectedCollection,
    clearSelection,
  };
}

export type ObligationSelection = ReturnType<typeof useObligationSelection>;
export type { Dispatch, SetStateAction };
