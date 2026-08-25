import React from "react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
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

type JournalEntriesListDesktopTableProps = JournalEntriesListProps;

export function JournalEntriesListDesktopTable(props: JournalEntriesListDesktopTableProps): React.JSX.Element {
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
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("ref") ? { id: "ref", label: t("accounting.columns.journal.ref") } : null,
          isColumnVisible("date") ? { id: "date", label: t("accounting.columns.journal.date") } : null,
          isColumnVisible("description") ? { id: "description", label: t("accounting.columns.journal.description") } : null,
          isColumnVisible("tags") ? { id: "tags", label: t("accounting.columns.journal.tags"), headerClassName: "hidden lg:table-cell" } : null,
          isColumnVisible("debit") ? { id: "debit", label: t("accounting.columns.journal.debit"), headerClassName: "text-end" } : null,
          isColumnVisible("credit") ? { id: "credit", label: t("accounting.columns.journal.credit"), headerClassName: "text-end" } : null,
          isColumnVisible("status") ? { id: "status", label: t("accounting.columns.journal.status") } : null,
        ].filter((c): c is Exclude<typeof c, null> => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canDelete ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("accounting.trash.selectAll"),
        } : undefined}
        actionsLabel={renderEntryActions !== undefined ? t("accounting.table.actions") : undefined}
      />
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
                <TableCell className="px-3 py-2.5 text-foreground max-w-cell-trunc truncate">{entry.description}</TableCell>
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
