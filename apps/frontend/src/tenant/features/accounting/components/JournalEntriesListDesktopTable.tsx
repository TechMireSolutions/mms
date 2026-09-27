import React from "react";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { WorkBatchTable } from "@/components/common/work";
import {
  getJournalBalanceDifference,
  getVisibleLeadingColumnCount,
  isJournalBalanced,
  type JournalEntriesListProps,
} from "@/tenant/features/accounting/components/journalEntriesListShared";
import { useJournalEntriesTableColumns } from "./useJournalEntriesTableColumns";

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

  const columns = useJournalEntriesTableColumns({
    isColumnVisible,
    journalStatusConfig,
    formatAmount,
  });

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
