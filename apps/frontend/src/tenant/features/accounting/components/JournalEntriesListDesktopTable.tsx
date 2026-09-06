import React from "react";
import { formatDate } from "@mms/shared";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work";
import type { JournalEntry } from "@/lib/data/accountingData";
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
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const columns = React.useMemo<WorkBatchTableColumn<JournalEntry>[]>(() => {
    const cols: WorkBatchTableColumn<JournalEntry>[] = [];

    if (isColumnVisible("ref")) {
      cols.push({
        id: "ref",
        label: t("accounting.columns.journal.ref"),
        render: (entry) => (
          <>
            <span className="font-mono text-xs font-bold text-primary">{entry.ref}</span>
            {entry.reversed_ref && (
              <p className="text-xs text-warning font-semibold m-0">
                {t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}
              </p>
            )}
            {entry.simple_mode && (
              <span className="text-xs text-primary/60 font-semibold m-0">
                {t("accounting.journal.dashboard.simpleMode")}
              </span>
            )}
          </>
        ),
      });
    }

    if (isColumnVisible("date")) {
      cols.push({
        id: "date",
        label: t("accounting.columns.journal.date"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (entry) => formatDate(entry.date),
      });
    }

    if (isColumnVisible("description")) {
      cols.push({
        id: "description",
        label: t("accounting.columns.journal.description"),
        cellClassName: "max-w-cell-trunc truncate",
        render: (entry) => entry.description,
      });
    }

    if (isColumnVisible("tags")) {
      cols.push({
        id: "tags",
        label: t("accounting.columns.journal.tags"),
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden lg:table-cell",
        render: (entry) => (
          <div className="flex flex-wrap gap-1">
            {(entry.tags || []).slice(0, 2).map((tag) => (
              <Badge key={tag} pill tone="primary" className="px-1.5 font-bold">
                {getJournalTagLabel(tag, t)}
              </Badge>
            ))}
            {(entry.tags || []).length > 2 && (
              <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>
            )}
          </div>
        ),
      });
    }

    if (isColumnVisible("debit")) {
      cols.push({
        id: "debit",
        label: t("accounting.columns.journal.debit"),
        headerClassName: "text-end",
        cellClassName: "text-end font-mono text-xs font-semibold text-info",
        render: (entry) => {
          const { totalDebit } = getJournalEntryLineTotals(entry);
          return formatAmount(totalDebit);
        },
      });
    }

    if (isColumnVisible("credit")) {
      cols.push({
        id: "credit",
        label: t("accounting.columns.journal.credit"),
        headerClassName: "text-end",
        cellClassName: "text-end font-mono text-xs font-semibold text-success",
        render: (entry) => {
          const { totalCredit } = getJournalEntryLineTotals(entry);
          return formatAmount(totalCredit);
        },
      });
    }

    if (isColumnVisible("status")) {
      cols.push({
        id: "status",
        label: t("accounting.columns.journal.status"),
        render: (entry) => <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />,
      });
    }

    return cols;
  }, [formatAmount, isColumnVisible, journalStatusConfig, t]);

  const tableFooter = (
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
  );

  return (
    <WorkBatchTable
      data={entries}
      columns={columns}
      caption={t("accounting.journal.dashboard.tableCaption")}
      className="table-fixed"
      bordered={false}
      selection={
        canDelete
          ? {
              selectedIds,
              onSelectOne: (id) => onToggleSelectedEntry(String(id), !selectedSet.has(String(id))),
              onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              selectAllAriaLabel: t("accounting.trash.selectAll"),
              selectRowAriaLabel: (entry) => t("accounting.trash.selectEntry", { ref: entry.ref }),
            }
          : undefined
      }
      columnResize={{
        getColumnWidth: (key) => getColumnWidth?.(key),
        onColumnResize,
      }}
      renderRowActions={renderEntryActions}
      actionsLabel={renderEntryActions !== undefined ? t("accounting.table.actions") : undefined}
      tableFooter={tableFooter}
    />
  );
}
