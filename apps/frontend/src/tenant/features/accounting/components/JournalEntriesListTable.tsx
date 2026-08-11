import React from "react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import {
  getJournalBalanceDifference,
  getJournalEntryLineTotals,
  getJournalTagLabel,
  getVisibleLeadingColumnCount,
  isJournalBalanced,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";

type JournalEntriesListTableProps = JournalEntriesListProps;

export function JournalEntriesListTable(props: JournalEntriesListTableProps): React.JSX.Element {
  const {
    entries,
    selectedIds,
    canDelete,
    allVisibleSelected,
    someVisibleSelected,
    isColumnVisible,
    journalStatusConfig,
    grandDebit,
    grandCredit,
    formatAmount,
    renderEntryActions,
    onToggleSelectedEntry,
    onToggleSelectAll,
    getColumnWidth,
    onColumnResize,
  } = props;
  const { t } = useTranslation();
  const visibleLeadingColumnCount = getVisibleLeadingColumnCount(isColumnVisible);
  const entriesCountLabel = formatDirectoryPageCountLabel(entries.length, t, {
    singular: "accounting.item.entry",
    plural: "accounting.item.entries",
  });
  const balanced = isJournalBalanced(grandDebit, grandCredit);

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("accounting.journal.dashboard.tableCaption")}</caption>
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
          {canDelete && (
            <TableHead className="px-3 py-2.5 w-10 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("accounting.trash.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("ref") && (
            <ModuleTableHeaderCell columnKey="ref" width={getColumnWidth?.("ref")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("accounting.columns.journal.ref")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("date") && (
            <ModuleTableHeaderCell columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("accounting.columns.journal.date")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("description") && (
            <ModuleTableHeaderCell columnKey="description" width={getColumnWidth?.("description")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("accounting.columns.journal.description")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("tags") && (
            <ModuleTableHeaderCell columnKey="tags" width={getColumnWidth?.("tags")} onResize={onColumnResize} className="px-3 py-2.5 hidden lg:table-cell">
              {t("accounting.columns.journal.tags")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("debit") && (
            <ModuleTableHeaderCell columnKey="debit" width={getColumnWidth?.("debit")} onResize={onColumnResize} className="px-3 py-2.5 text-end">
              {t("accounting.columns.journal.debit")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("credit") && (
            <ModuleTableHeaderCell columnKey="credit" width={getColumnWidth?.("credit")} onResize={onColumnResize} className="px-3 py-2.5 text-end">
              {t("accounting.columns.journal.credit")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("accounting.columns.journal.status")}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-3 py-2.5 text-end h-auto">
            <span className="sr-only">{t("accounting.table.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border">
        {entries.map((entry) => {
          const { totalDebit, totalCredit } = getJournalEntryLineTotals(entry);
          return (
            <TableRow key={entry.id} className="group hover:bg-muted/20 transition-colors">
              {canDelete && (
                <TableCell className="px-3 py-2.5">
                  <Checkbox
                    checked={selectedIds.includes(entry.id)}
                    onCheckedChange={(checked) => onToggleSelectedEntry(entry.id, checked === true)}
                    aria-label={t("accounting.trash.selectEntry", { ref: entry.ref })}
                  />
                </TableCell>
              )}
              {isColumnVisible("ref") && (
                <TableCell className="px-3 py-2.5">
                  <span className="font-mono text-xs font-bold text-primary">{entry.ref}</span>
                  {entry.reversed_ref && <p className="text-xs text-warning font-semibold m-0">{t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}</p>}
                  {entry.simple_mode && <span className="text-xs text-primary/60 font-semibold m-0">{t("accounting.journal.dashboard.simpleMode")}</span>}
                </TableCell>
              )}
              {isColumnVisible("date") && (
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(entry.date)}
                </TableCell>
              )}
              {isColumnVisible("description") && (
                <TableCell className="px-3 py-2.5 text-foreground max-w-[12.5rem] truncate">{entry.description}</TableCell>
              )}
              {isColumnVisible("tags") && (
                <TableCell className="px-3 py-2.5 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(entry.tags || []).slice(0, 2).map((tag) => (
                      <Badge key={tag} pill tone="primary" className="px-1.5 font-bold">
                        {getJournalTagLabel(tag, t)}
                      </Badge>
                    ))}
                    {(entry.tags || []).length > 2 && <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>}
                  </div>
                </TableCell>
              )}
              {isColumnVisible("debit") && (
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-info">
                  {formatAmount(totalDebit)}
                </TableCell>
              )}
              {isColumnVisible("credit") && (
                <TableCell className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-success">
                  {formatAmount(totalCredit)}
                </TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-3 py-2.5"><StatusBadge status={entry.status} config={journalStatusConfig} size="sm" /></TableCell>
              )}
              <TableCell className="px-3 py-2.5 text-end">
                {renderEntryActions(entry)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter className="border-t-2 border-border bg-muted/30">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={visibleLeadingColumnCount || 1} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
            {entriesCountLabel}
          </TableCell>
          {isColumnVisible("debit") && (
            <TableCell className="px-3 py-2 text-end font-mono font-bold text-info text-xs">
              {formatAmount(grandDebit)}
            </TableCell>
          )}
          {isColumnVisible("credit") && (
            <TableCell className="px-3 py-2 text-end font-mono font-bold text-success text-xs">
              {formatAmount(grandCredit)}
            </TableCell>
          )}
          <TableCell colSpan={(isColumnVisible("status") ? 1 : 0) + 1} className="px-3 py-2 text-end text-xs font-semibold text-muted-foreground">
            {balanced ? (
              <span className="text-success">{t("accounting.journal.dashboard.balanced")}</span>
            ) : (
              <span className="text-destructive">
                {t("accounting.journal.dashboard.difference", { diff: getJournalBalanceDifference(grandDebit, grandCredit, formatAmount) })}
              </span>
            )}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
