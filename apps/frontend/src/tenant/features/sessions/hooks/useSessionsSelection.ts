import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Session } from '@/lib/data/sessionsData';

export function useSessionsSelection(sessions: Session[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = sessions.length > 0
    && sessions.every((sessionItem) => selectedIds.includes(sessionItem.id));
  const someVisibleSelected = sessions.some((sessionItem) => selectedIds.includes(sessionItem.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = sessions.map((sessionItem) => sessionItem.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedSession = (id: string, checked: boolean) => {
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
    toggleSelectedSession,
    clearSelection,
  };
}

export function toggleFilterValue<T>(
  selectedValues: T[],
  setSelectedValues: Dispatch<SetStateAction<T[]>>,
  nextValue: T,
): void {
  setSelectedValues((currentValues) =>
    currentValues.includes(nextValue)
      ? currentValues.filter((value) => value !== nextValue)
      : [...currentValues, nextValue],
  );
}
