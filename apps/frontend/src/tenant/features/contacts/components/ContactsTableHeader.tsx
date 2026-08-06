import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WORK_STICKY_HEAD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import {
  TableHeaderCell,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/ContactTableRow";
import type { useTranslation } from "@/hooks/useTranslation";

type Translate = ReturnType<typeof useTranslation>["t"];

export function ContactsTableHeader({
  columns,
  sortField,
  sortDir,
  onSort,
  getColumnWidth,
  setColumnWidth,
  allSelected,
  someSelected,
  onSelectAll,
  t,
}: {
  columns: ContactsColumnConfig[];
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  t: Translate;
}): React.JSX.Element {
  return (
    <TableHeader>
      <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
        <TableHead
          className={cn(
            "w-12 min-w-12 px-4 py-3 sticky start-0 z-20 border-e border-border/30 h-auto",
            WORK_STICKY_HEAD,
          )}
        >
          <Checkbox
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={() => onSelectAll()}
            aria-label={allSelected ? t("common.deselect") : t("contacts.table.selectAll")}
            className="cursor-pointer"
          />
        </TableHead>
        {columns.map((col) => {
          const sortFieldKey = col.sortField || col.id;
          const isNameCol = col.id === "name";
          const stickyClass = isNameCol
            ? cn("sticky start-12 z-20 border-e border-border/30", WORK_STICKY_HEAD)
            : "";
          const width = getColumnWidth(col.id) ?? col.width;

          return sortFieldKey ? (
            <TableHeaderCell
              key={col.id}
              columnKey={col.id}
              field={sortFieldKey}
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
              width={width}
              onResize={setColumnWidth}
              className={stickyClass}
            >
              {col.label}
            </TableHeaderCell>
          ) : (
            <ResizableTableHead
              key={col.id}
              columnKey={col.id}
              width={width}
              onResize={setColumnWidth}
              className={`px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide ${stickyClass}`}
            >
              {col.label}
            </ResizableTableHead>
          );
        })}
        <TableHead className="px-4 py-3 w-16 h-auto">
          <span className="sr-only">{t("contacts.table.actions")}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
