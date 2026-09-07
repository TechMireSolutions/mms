import { useRef, useMemo, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  const parentRef = useRef<HTMLDivElement | null>(null);
  const isVirtualized = items.length > 50;

  const itemPairs = useMemo(() => {
    if (!isVirtualized) return [];
    const pairs: T[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push(items.slice(i, i + 2));
    }
    return pairs;
  }, [items, isVirtualized]);

  const rowVirtualizer = useVirtualizer({
    count: itemPairs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
    enabled: isVirtualized,
  });

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

      {isVirtualized ? (
        <div
          ref={parentRef}
          className="w-full max-h-[75vh] overflow-y-auto overflow-x-hidden pe-1"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const pair = itemPairs[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pair.map(renderItem)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DirectoryCardsGrid>
          {items.map(renderItem)}
        </DirectoryCardsGrid>
      )}
    </>
  );
}
