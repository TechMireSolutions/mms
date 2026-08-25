import React, { type JSX } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WORK_STICKY_HEAD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface ModuleWorkTableHeaderProps<
  TCol extends { id: string; label: string; sortField?: string; width?: number; headerClassName?: string }
> {
  columns: TCol[];
  sortField?: string;
  sortDir?: "asc" | "desc";
  onSort?: (field: string) => void;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  
  selection?: {
    allSelected: boolean;
    someSelected: boolean;
    onSelectAll: () => void;
    ariaLabel: string;
  };
  
  actionsLabel?: string;
  
  // Optional name property to make it sticky beside the checkbox.
  // Defaults to "name" as the identifier for the sticky column if any.
  stickyColumnId?: string;
}

export function ModuleWorkTableHeader<
  TCol extends { id: string; label: string; sortField?: string; width?: number; headerClassName?: string }
>({
  columns,
  sortField,
  sortDir,
  onSort,
  getColumnWidth,
  setColumnWidth,
  selection,
  actionsLabel,
  stickyColumnId = "name",
}: ModuleWorkTableHeaderProps<TCol>): JSX.Element {
  return (
    <TableHeader>
      <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
        {selection && (
          <TableHead
            className={cn(
              "w-12 min-w-12 px-4 py-3 sticky start-0 z-20 border-e border-border/30 h-auto",
              WORK_STICKY_HEAD,
            )}
          >
            <Checkbox
              checked={selection.someSelected ? "indeterminate" : selection.allSelected}
              onCheckedChange={() => selection.onSelectAll()}
              aria-label={selection.ariaLabel}
              className="cursor-pointer"
            />
          </TableHead>
        )}
        
        {columns.map((col) => {
          const sortKey = col.sortField || col.id;
          
          // If there is a selection column, the sticky column needs to start at offset 12 (48px).
          // Otherwise, it starts at 0.
          let stickyClass = "";
          if (col.id === stickyColumnId) {
            if (selection) {
              stickyClass = cn("sticky start-12 z-20 border-e border-border/30", WORK_STICKY_HEAD);
            } else {
              stickyClass = cn("sticky start-0 z-20 border-e border-border/30", WORK_STICKY_HEAD);
            }
          }

          const width = getColumnWidth(col.id) ?? col.width;

          return (
            <ModuleTableHeaderCell
              key={col.id}
              columnKey={col.id}
              sortKey={sortKey}
              activeSortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
              width={width}
              onResize={setColumnWidth}
              className={cn("px-4 py-3 whitespace-nowrap", stickyClass, col.headerClassName)}
            >
              {col.label}
            </ModuleTableHeaderCell>
          );
        })}
        
        {actionsLabel && (
          <TableHead className="px-4 py-3 w-16 h-auto">
            <span className="sr-only">{actionsLabel}</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
