import React, { memo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

interface TableHeaderCellProps {
  columnKey: string;
  field: string;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  width?: number;
  onResize?: (columnKey: string, width: number) => void;
  children: React.ReactNode;
  className?: string;
}

export const TableHeaderCell = memo(function TableHeaderCell({
  columnKey,
  field,
  sortField,
  sortDir,
  onSort,
  width,
  onResize,
  children,
  className,
}: TableHeaderCellProps): React.JSX.Element {
  const isSorted = sortField === field;
  const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <ResizableTableHead
      columnKey={columnKey}
      width={width}
      onResize={onResize}
      aria-sort={ariaSort}
      className={`px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors ${className || ""}`}
      onClick={() => onSort(field)}
    >
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
    </ResizableTableHead>
  );
});
