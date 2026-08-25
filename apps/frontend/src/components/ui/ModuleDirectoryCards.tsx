import type { ReactNode } from "react";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";

export interface ModuleDirectoryCardsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  
  // Selection
  selectedIds: (string | number)[];
  onSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  
  // Labels
  selectAllLabel?: string;
  deselectAllLabel?: string;
  selectedCountLabel?: ReactNode;
  pageCountLabel?: ReactNode;
  checkboxIdPrefix?: string;
}

export function ModuleDirectoryCards<T>({
  items,
  renderItem,
  selectedIds,
  onSelectAll,
  allSelected = false,
  someSelected = false,
  selectAllLabel = "Select All",
  deselectAllLabel = "Deselect",
  selectedCountLabel,
  pageCountLabel,
  checkboxIdPrefix = "module-cards",
}: ModuleDirectoryCardsProps<T>) {
  return (
    <>
      {onSelectAll && items.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId={`${checkboxIdPrefix}-select-all`}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          selectLabel={selectAllLabel}
          deselectLabel={deselectAllLabel}
          selectedCount={selectedIds.length}
          selectedCountLabel={selectedCountLabel || `${selectedIds.length} selected`}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {items.map(renderItem)}
      </DirectoryCardsGrid>
    </>
  );
}
