import React, { type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Table, TableBody, TableCell } from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { ModuleTableSelectionCell } from "@/components/ui/ModuleTableSelectionCell";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";

import { useListRowMotion } from "@/hooks/useListRowMotion";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
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
  rowClassName,
  className,
  tableBodyClassName,
  containerClassName,
}: WorkBatchTableProps<TData>): JSX.Element {
  const rowMotion = useListRowMotion({ layout: "position", fade: true, duration: 0.1 });

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
      <div className={cn("overflow-x-auto", bordered && "rounded-lg border border-border/60 bg-card")}>
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
            <AnimatePresence initial={false}>
              {activeRows.map((row, rowIndex) => {
                const idStr = String(row.id);
                const isSelected = selectedSet.has(row.id) || selectedSet.has(idStr);
                const rowAriaLabel = selection?.selectRowAriaLabel
                  ? selection.selectRowAriaLabel(row)
                  : `Select row ${idStr}`;

                return (
                  <motion.tr
                    key={idStr}
                    {...rowMotion}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group border-b border-border/40 transition-colors hover:bg-muted/40",
                      isSelected && "bg-accent/15",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row),
                    )}
                  >
                    {/* Selectable Row Checkbox */}
                    {selection && (
                      <ModuleTableSelectionCell
                        checked={isSelected}
                        onCheckedChange={() => selection.onSelectOne(idStr)}
                        ariaLabel={rowAriaLabel}
                        stopPropagation={Boolean(onRowClick)}
                      />
                    )}

                    {/* Columns */}
                    {columns.map((col) => {
                      const isSticky = stickyColumnId === col.id;
                      const customCellClass =
                        typeof col.cellClassName === "function"
                          ? col.cellClassName(row)
                          : col.cellClassName;

                      return (
                        <TableCell
                          key={col.id}
                          className={cn(
                            "px-4 py-3 text-sm text-foreground transition-colors",
                            isSticky &&
                              "sticky start-12 z-10 border-e border-border/30",
                            isSticky ? workTableStickyCellBg(isSelected) : undefined,
                            customCellClass,
                          )}
                        >
                          {col.render(row, rowIndex)}
                        </TableCell>
                      );
                    })}

                    {/* Actions Menu */}
                    {renderRowActions && (
                      <TableCell
                        className="w-12 min-w-12 px-2 py-3 text-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderRowActions(row, rowIndex)}
                      </TableCell>
                    )}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
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
