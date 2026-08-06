/**
 * Shared Work-directory multi-select helpers (Contacts gold-standard).
 * Checkbox toggles selection; page select-all merges/removes current page ids
 * without dropping selections from other pages.
 */

export function getDirectoryPageSelection(
  pageIds: ReadonlyArray<string | number>,
  selected: ReadonlyArray<string | number>,
): { allSelected: boolean; someSelected: boolean; selectedOnPage: number } {
  if (pageIds.length === 0) {
    return { allSelected: false, someSelected: false, selectedOnPage: 0 };
  }
  const selectedSet = new Set(selected);
  let selectedOnPage = 0;
  for (const id of pageIds) {
    if (selectedSet.has(id)) selectedOnPage += 1;
  }
  return {
    allSelected: selectedOnPage === pageIds.length,
    someSelected: selectedOnPage > 0 && selectedOnPage < pageIds.length,
    selectedOnPage,
  };
}

export function toggleIdInSelection<T extends string | number>(
  selected: readonly T[],
  id: T,
): T[] {
  return selected.includes(id)
    ? selected.filter((selectedId) => selectedId !== id)
    : [...selected, id];
}

/** Toggle current-page ids into/out of selection (keeps other pages). */
export function togglePageIdsInSelection<T extends string | number>(
  selected: readonly T[],
  pageIds: readonly T[],
): T[] {
  if (pageIds.length === 0) return [...selected];
  const selectedSet = new Set(selected);
  const allOnPage = pageIds.every((id) => selectedSet.has(id));
  if (allOnPage) {
    const pageSet = new Set(pageIds);
    return selected.filter((id) => !pageSet.has(id));
  }
  const next = new Set(selected);
  for (const id of pageIds) next.add(id);
  return [...next];
}
