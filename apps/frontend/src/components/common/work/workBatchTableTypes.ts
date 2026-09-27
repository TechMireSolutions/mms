import type React from "react";

/**
 * Computes allSelected / someSelected from a list of items and a selection set.
 * Eliminates duplicated inline derivation across table views.
 */
export function deriveSelectionState<T extends { id: string | number }>(
  items: T[],
  selectedIds: ReadonlySet<string> | ReadonlySet<string | number> | ReadonlyArray<string | number>,
): { allSelected: boolean; someSelected: boolean } {
  const has = (id: string | number): boolean => {
    if (selectedIds instanceof Set) {
      return (selectedIds as ReadonlySet<string | number>).has(id) ||
        (selectedIds as ReadonlySet<string | number>).has(String(id));
    }
    const arr = selectedIds as ReadonlyArray<string | number>;
    return arr.includes(id) || arr.includes(String(id));
  };
  const allSelected = items.length > 0 && items.every((x) => has(x.id));
  const someSelected = !allSelected && items.some((x) => has(x.id));
  return { allSelected, someSelected };
}

/** Shared container class string for bordered WorkBatchTable wrappers. */
export const WORK_TABLE_CONTAINER_CLASS =
  "rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm" as const;

export interface WorkBatchTableColumn<TData> {
  id: string;
  label: string;
  sortField?: string;
  width?: number;
  headerClassName?: string;
  cellClassName?: string | ((row: TData) => string | undefined);
  render: (row: TData, index: number) => React.ReactNode;
}

export interface WorkBatchTableProps<TData extends { id: string | number }> {
  data: TData[];
  columns: WorkBatchTableColumn<TData>[];

  // Selection
  selection?: {
    selectedIds:
      | Set<string | number>
      | ReadonlySet<string | number>
      | ReadonlySet<string>
      | Array<string | number>
      | ReadonlyArray<string | number>;
    onSelectOne: (id: string) => void;
    onSelectAll: () => void;
    allSelected: boolean;
    someSelected: boolean;
    selectAllAriaLabel?: string;
    selectRowAriaLabel?: (row: TData) => string;
  };

  // Sorting
  sort?: {
    field?: string;
    dir?: "asc" | "desc";
    onSort: (field: string) => void;
  };

  // Column Resizing
  columnResize?: {
    getColumnWidth?: (key: string) => number | undefined;
    onColumnResize?: (key: string, width: number) => void;
  };

  // Row Actions
  renderRowActions?: (row: TData, index: number) => React.ReactNode;
  actionsLabel?: string;
  actionsHeaderClassName?: string;
  actionsCellClassName?: string;

  // Sticky column
  stickyColumnId?: string;

  // Optimistic removals
  optimisticDeletedIds?: Set<string | number>;

  // Footer summary
  footerCount?: {
    pageCountLabel?: string;
    selectedCountLabel?: string;
  };

  // Screen reader caption
  caption?: string;

  // Outer border styling (default: true)
  bordered?: boolean;

  // Custom table footer element (rendered inside Table)
  tableFooter?: React.ReactNode;

  // Empty & loading states
  emptyState?: React.ReactNode;
  isLoading?: boolean;

  onRowClick?: (row: TData) => void;
  onRowHover?: (row: TData) => void;
  virtualize?: boolean;
  maxHeightClassName?: string;
  rowClassName?: (row: TData) => string | undefined;
  className?: string;
  tableBodyClassName?: string;
  containerClassName?: string;
}
