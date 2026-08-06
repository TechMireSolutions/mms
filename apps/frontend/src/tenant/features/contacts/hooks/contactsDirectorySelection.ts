/** Page-scoped selection state for Contacts Work directory (table + cards). */
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
