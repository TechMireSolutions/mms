import React from "react";
import { motion } from "framer-motion";
import { TableCell } from "@/components/ui/table";
import { ModuleTableSelectionCell } from "@/components/ui/ModuleTableSelectionCell";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
import { cn } from "@/lib/utils";
import type { ListRowMotionFn } from "@/hooks/useListRowMotion";
import type { WorkBatchTableColumn } from "./WorkBatchTable";

export interface WorkBatchTableRowProps<TData extends { id: string | number }> {
  row: TData;
  rowIndex: number;
  isMotion: boolean;
  isSelected: boolean;
  rowMotion?: ListRowMotionFn;
  onRowClick?: (row: TData) => void;
  onRowHover?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  hasSelection: boolean;
  onSelectOne?: (id: string) => void;
  selectRowAriaLabel?: (row: TData) => string;
  columns: WorkBatchTableColumn<TData>[];
  stickyColumnId?: string;
  renderRowActions?: (row: TData, rowIndex: number) => React.ReactNode;
}

function WorkBatchTableRowComponent<TData extends { id: string | number }>(
  props: WorkBatchTableRowProps<TData>,
): React.JSX.Element {
  const {
    row,
    rowIndex,
    isMotion,
    isSelected,
    rowMotion,
    onRowClick,
    onRowHover,
    rowClassName,
    hasSelection,
    onSelectOne,
    selectRowAriaLabel,
    columns,
    stickyColumnId,
    renderRowActions,
  } = props;

  const idStr = String(row.id);
  const rowAriaLabel = selectRowAriaLabel
    ? selectRowAriaLabel(row)
    : `Select row ${idStr}`;

  const trProps = {
    onClick: () => onRowClick?.(row),
    onMouseEnter: onRowHover ? () => onRowHover(row) : undefined,
    className: cn(
      "group border-b border-border/40 transition-colors hover:bg-muted/40",
      isSelected && "bg-accent/15",
      onRowClick && "cursor-pointer",
      rowClassName?.(row),
    ),
  };

  const cells = (
    <>
      {/* Selectable Row Checkbox */}
      {hasSelection && onSelectOne && (
        <ModuleTableSelectionCell
          checked={isSelected}
          onCheckedChange={() => onSelectOne(idStr)}
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
              isSticky && "sticky start-12 z-10 border-e border-border/30",
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
    </>
  );

  const motionProps = isMotion && rowMotion ? rowMotion(rowIndex * 0.02) : undefined;

  return isMotion ? (
    <motion.tr key={idStr} {...motionProps} {...trProps}>
      {cells}
    </motion.tr>
  ) : (
    <tr key={idStr} {...trProps}>
      {cells}
    </tr>
  );
}

export const WorkBatchTableRow = React.memo(
  WorkBatchTableRowComponent,
) as typeof WorkBatchTableRowComponent;
