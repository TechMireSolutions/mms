import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Distribution } from '@/lib/data/hasanatData';

/** Work directory row selection SSOT for Hasanat distributions (Exam-shaped). */
export function useDistributionSelection(distributions: Distribution[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = distributions.length > 0
    && distributions.every((distribution) => selectedSet.has(distribution.id));
  const someVisibleSelected = selectedSet.size > 0 && distributions.some((distribution) => selectedSet.has(distribution.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = distributions.map((distribution) => distribution.id);
    const visibleSet = new Set(visibleIds);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleSet.has(id)));
  };

  const toggleSelectedDistribution = (id: string, checked: boolean) => {
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
    toggleSelectedDistribution,
    clearSelection,
  };
}

export type DistributionSelection = ReturnType<typeof useDistributionSelection>;
export type { Dispatch, SetStateAction };
