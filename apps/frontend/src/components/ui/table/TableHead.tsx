import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableHeadProps } from "./tableTypes";
import { getAriaSort, getTableCellAlignClass, getTableCellWrapClass } from "./tableUtils";

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, noWrap, truncate, align, variant, isFocusable, tabIndex, sortDirection, onSort, children, ...props }, ref) => {
    const ariaSort = getAriaSort(sortDirection);
    const wrapClass = getTableCellWrapClass(noWrap, truncate);
    const alignClass = getTableCellAlignClass(align, variant);

    const sortIcon = sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
    ) : sortDirection === "desc" ? (
      <ArrowDown className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
    ) : sortDirection === "none" || onSort ? (
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
    ) : null;

    return (
      <th
        ref={ref}
        role="columnheader"
        scope="col"
        aria-sort={ariaSort}
        tabIndex={isFocusable ? (tabIndex ?? 0) : tabIndex}
        className={cn(
          "h-10 px-2 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-0.5",
          wrapClass,
          alignClass,
          isFocusable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
          className
        )}
        {...props}
      >
        {onSort ? (
          <button
            type="button"
            onClick={onSort}
            className="inline-flex items-center gap-1.5 font-inherit text-inherit hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
          >
            <span>{children}</span>
            {sortIcon}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {children}
            {sortIcon}
          </span>
        )}
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

export const TableHeadCell = TableHead;
