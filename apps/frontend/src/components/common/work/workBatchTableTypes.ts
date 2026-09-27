import type React from "react";

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
