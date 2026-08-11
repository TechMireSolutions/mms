import { useState, type Dispatch, type SetStateAction } from 'react';
import type { ObligationCollection } from '@/lib/data/obligationsData';

/** Work directory row selection SSOT for obligation collections (Hasanat-shaped). */
export function useObligationSelection(collections: ObligationCollection[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = collections.length > 0
    && collections.every((collection) => selectedIds.includes(collection.id));
  const someVisibleSelected = collections.some((collection) => selectedIds.includes(collection.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = collections.map((collection) => collection.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedCollection = (id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  };

  const clearSelection = () => setSelectedIds([]);

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
