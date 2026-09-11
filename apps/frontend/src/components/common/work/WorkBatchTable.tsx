import React, { type JSX } from "react";
import { AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody } from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { WorkBatchTableRow } from "./WorkBatchTableRow";

import { useListRowMotion } from "@/hooks/useListRowMotion";
import { cn } from "@/lib/utils";

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
    selectedIds: Set<string | number> | Array<string | number>;
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

/**
 * Universal WorkBatchTable primitive.
 * Standardizes operational tables with selectable rows, sticky headers,
 * sortable columns, resizable headers, and row actions.
 */
export function WorkBatchTable<TData extends { id: string | number }>({
  data,
  columns,
  selection,
  sort,
  columnResize,
  renderRowActions,
  actionsLabel = "Actions",
  stickyColumnId,
  optimisticDeletedIds,
  footerCount,
  caption,
  bordered = true,
  tableFooter,
  emptyState,
  isLoading,
  onRowClick,
  onRowHover,
  virtualize,
  maxHeightClassName = "max-h-150",
  rowClassName,
  className,
  tableBodyClassName,
  containerClassName,
}: WorkBatchTableProps<TData>): JSX.Element {
  const rowMotion = useListRowMotion({ layout: "position", fade: true, duration: 0.1 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedSet = React.useMemo(() => {
    if (!selection) return new Set<string | number>();
    return selection.selectedIds instanceof Set
      ? selection.selectedIds
      : new Set(selection.selectedIds);
  }, [selection]);

  const activeRows = React.useMemo(() => {
    if (!optimisticDeletedIds || optimisticDeletedIds.size === 0) return data;
    return data.filter((row) => !optimisticDeletedIds.has(row.id));
  }, [data, optimisticDeletedIds]);

  const isVirtualized = Boolean(virtualize ?? (activeRows.length > 30));

  const rowVirtualizer = useVirtualizer({
    count: activeRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 52,
    overscan: 10,
    enabled: isVirtualized,
  });

  const virtualItems = isVirtualized ? rowVirtualizer.getVirtualItems() : [];
  const totalColSpan = columns.length + (selection ? 1 : 0) + (renderRowActions ? 1 : 0);

  if (!isLoading && activeRows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const headerColumns = columns.map((col) => ({
    id: col.id,
    label: col.label,
    sortField: col.sortField,
    width: col.width,
    headerClassName: col.headerClassName,
  }));

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-auto",
          isVirtualized && cn(maxHeightClassName, "overflow-y-auto"),
          bordered && "rounded-lg border border-border/60 bg-card",
        )}
      >
        <Table className={cn("table-fixed w-full", className)}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <ModuleWorkTableHeader
            columns={headerColumns}
            sortField={sort?.field}
            sortDir={sort?.dir}
            onSort={sort?.onSort}
            getColumnWidth={(key) => columnResize?.getColumnWidth?.(key)}
            setColumnWidth={(key, width) => columnResize?.onColumnResize?.(key, width)}
            selection={
              selection
                ? {
                    allSelected: selection.allSelected,
                    someSelected: selection.someSelected,
                    onSelectAll: selection.onSelectAll,
                    ariaLabel: selection.selectAllAriaLabel ?? "Select all rows",
                  }
                : undefined
            }
            actionsLabel={renderRowActions ? actionsLabel : undefined}
            stickyColumnId={stickyColumnId}
          />

          <TableBody className={cn("divide-y divide-border/50", tableBodyClassName)}>
            {isVirtualized ? (
              <>
                {virtualItems.length > 0 && (
                  <tr style={{ height: `${virtualItems[0].start}px` }}>
                    <td colSpan={totalColSpan} className="p-0 border-0" />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = activeRows[virtualRow.index];
                  const isSelected = selectedSet.has(row.id) || selectedSet.has(String(row.id));
                  return (
                    <WorkBatchTableRow
                      key={String(row.id)}
                      row={row}
                      rowIndex={virtualRow.index}
                      isMotion={false}
                      isSelected={isSelected}
                      rowMotion={rowMotion}
                      onRowClick={onRowClick}
                      onRowHover={onRowHover}
                      rowClassName={rowClassName}
                      hasSelection={Boolean(selection)}
                      onSelectOne={selection?.onSelectOne}
                      selectRowAriaLabel={selection?.selectRowAriaLabel}
                      columns={columns}
                      stickyColumnId={stickyColumnId}
                      renderRowActions={renderRowActions}
                    />
                  );
                })}
                {virtualItems.length > 0 && (
                  <tr
                    style={{
                      height: `${
                        rowVirtualizer.getTotalSize() -
                        virtualItems[virtualItems.length - 1].end
                      }px`,
                    }}
                  >
                    <td colSpan={totalColSpan} className="p-0 border-0" />
                  </tr>
                )}
              </>
            ) : (
              <AnimatePresence initial={false}>
                {activeRows.map((row, rowIndex) => {
                  const isSelected = selectedSet.has(row.id) || selectedSet.has(String(row.id));
                  return (
                    <WorkBatchTableRow
                      key={String(row.id)}
                      row={row}
                      rowIndex={rowIndex}
                      isMotion={true}
                      isSelected={isSelected}
                      rowMotion={rowMotion}
                      onRowClick={onRowClick}
                      onRowHover={onRowHover}
                      rowClassName={rowClassName}
                      hasSelection={Boolean(selection)}
                      onSelectOne={selection?.onSelectOne}
                      selectRowAriaLabel={selection?.selectRowAriaLabel}
                      columns={columns}
                      stickyColumnId={stickyColumnId}
                      renderRowActions={renderRowActions}
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
          {tableFooter}
        </Table>
      </div>

      {footerCount && (
        <ModuleTableFooterCount
          selectedCount={selectedSet.size}
          selectedCountLabel={footerCount.selectedCountLabel ?? ""}
          pageCountLabel={footerCount.pageCountLabel ?? ""}
        />
      )}
    </div>
  );
}
