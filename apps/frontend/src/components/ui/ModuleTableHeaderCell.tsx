import React, { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { cn } from "@/lib/utils";

/** Canonical Work-table header cell chrome — SSOT for header typography/padding across module tables. */
export const MODULE_TABLE_HEAD_CLASS =
  "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export interface ModuleTableHeaderCellProps {
  columnKey: string;
  width?: number;
  onResize?: (columnKey: string, width: number) => void;
  className?: string;
  children: React.ReactNode;
  /** Sort key this column maps to. When provided, the cell renders sortable chrome (chevron + aria-sort). */
  sortKey?: string | null;
  /** Currently active sort field. */
  activeSortField?: string | null;
  sortDir?: "asc" | "desc";
  onSort?: (field: string) => void;
}

export const ModuleTableHeaderCell = memo(function ModuleTableHeaderCell({
  columnKey,
  width,
  onResize,
  className,
  children,
  sortKey,
  activeSortField,
  sortDir = "asc",
  onSort,
}: ModuleTableHeaderCellProps): React.JSX.Element {
  const sortable = Boolean(sortKey);
  const isSorted = sortable && activeSortField === sortKey;
  const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <ResizableTableHead
      columnKey={columnKey}
      width={width}
      onResize={onResize}
      aria-sort={ariaSort}
      className={cn(
        MODULE_TABLE_HEAD_CLASS,
        sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
        className,
      )}
      onClick={sortable && onSort ? () => onSort(sortKey as string) : undefined}
    >
      {sortable ? (
        <div className="flex items-center gap-1">
          {children}
          {isSorted ? (
            sortDir === "asc" ? (
              <ChevronUp className="w-3 h-3 text-primary" />
            ) : (
              <ChevronDown className="w-3 h-3 text-primary" />
            )
          ) : (
            <ChevronUp className="w-3 h-3 opacity-20" />
          )}
        </div>
      ) : (
        children
      )}
    </ResizableTableHead>
  );
});
