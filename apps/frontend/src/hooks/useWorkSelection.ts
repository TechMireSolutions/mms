import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Controller-owned Work directory row selection SSOT.
 * Lists supply their visible ids for select-all and derive
 * all/some-visible flags from the returned selectedIds.
 */
export function useWorkSelection<T extends string | number = string>() {
  const [selectedIds, setSelectedIds] = useState<T[]>([]);

  const toggleSelected = useCallback((id: T, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((selectedId) => selectedId !== id),
    );
  }, []);

  const toggleSelectAll = useCallback((checked: boolean, visibleIds: T[]) => {
    setSelectedIds((current) => {
      const visibleSet = new Set(visibleIds);
      return checked
        ? [...new Set([...current, ...visibleIds])]
        : current.filter((id) => !visibleSet.has(id));
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds((current) => (current.length === 0 ? current : []));
  }, []);

  return { selectedIds, setSelectedIds, toggleSelected, toggleSelectAll, clearSelection };
}

export type WorkSelection<T extends string | number = string> = ReturnType<
  typeof useWorkSelection<T>
>;
export type { Dispatch, SetStateAction };
