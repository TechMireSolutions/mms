import React, { type JSX } from "react";
import { AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody } from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { WorkBatchTableRow } from "./WorkBatchTableRow";
import { WorkBatchTableVirtualizedRows } from "./WorkBatchTableVirtualizedRows";
import type {
  WorkBatchTableColumn,
  WorkBatchTableProps,
} from "./workBatchTableTypes";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { cn } from "@/lib/utils";

export type { WorkBatchTableColumn, WorkBatchTableProps };

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
  actionsHeaderClassName,
  actionsCellClassName,
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

  const isVirtualized = Boolean(virtualize ?? activeRows.length > 30);

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
            actionsClassName={actionsHeaderClassName}
            stickyColumnId={stickyColumnId}
          />

          <TableBody className={cn("divide-y divide-border/50", tableBodyClassName)}>
            {isVirtualized ? (
              <WorkBatchTableVirtualizedRows
                virtualItems={virtualItems}
                activeRows={activeRows}
                selectedSet={selectedSet}
                totalColSpan={totalColSpan}
                totalSize={rowVirtualizer.getTotalSize()}
                columns={columns}
                stickyColumnId={stickyColumnId}
                hasSelection={Boolean(selection)}
                onSelectOne={selection?.onSelectOne}
                selectRowAriaLabel={selection?.selectRowAriaLabel}
                renderRowActions={renderRowActions}
                actionsCellClassName={actionsCellClassName}
                onRowClick={onRowClick}
                onRowHover={onRowHover}
                rowClassName={rowClassName}
              />
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
                      actionsCellClassName={actionsCellClassName}
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
