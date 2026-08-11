import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Distribution } from '@/lib/data/hasanatData';

/** Work directory row selection SSOT for Hasanat distributions (Exam-shaped). */
export function useDistributionSelection(distributions: Distribution[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = distributions.length > 0
    && distributions.every((distribution) => selectedIds.includes(distribution.id));
  const someVisibleSelected = distributions.some((distribution) => selectedIds.includes(distribution.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = distributions.map((distribution) => distribution.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
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
