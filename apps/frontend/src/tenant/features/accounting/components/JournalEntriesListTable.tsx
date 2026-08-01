import React from "react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getJournalBalanceDifference,
  getJournalEntriesCountLabel,
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
    allFilteredSelected,
    visibleColumns,
    journalStatusConfig,
    grandDebit,
    grandCredit,
    formatAmount,
    renderEntryActions,
    onToggleSelected,
    onToggleAll,
    getColumnWidth,
    onColumnResize,
  } = props;
  const { t } = useTranslation();
  const visibleLeadingColumnCount = getVisibleLeadingColumnCount(visibleColumns);
  const entriesCountLabel = getJournalEntriesCountLabel(entries.length, t);
  const balanced = isJournalBalanced(grandDebit, grandCredit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <caption className="sr-only">{t("accounting.journal.dashboard.tableCaption")}</caption>
        <thead className="bg-muted/60 border-b border-border">
          <tr>
            {canDelete && (
              <th scope="col" className="px-3 py-2.5 w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) => onToggleAll(checked === true)}
                  aria-label={t("accounting.trash.selectAll")}
                />
              </th>
            )}
            {visibleColumns.ref && (
              <ResizableTableHead columnKey="ref" width={getColumnWidth?.("ref")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.ref")}
              </ResizableTableHead>
            )}
            {visibleColumns.date && (
              <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.date")}
              </ResizableTableHead>
            )}
            {visibleColumns.description && (
              <ResizableTableHead columnKey="description" width={getColumnWidth?.("description")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.description")}
              </ResizableTableHead>
            )}
            {visibleColumns.tags && (
              <ResizableTableHead columnKey="tags" width={getColumnWidth?.("tags")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                {t("accounting.columns.journal.tags")}
              </ResizableTableHead>
            )}
            {visibleColumns.debit && (
              <ResizableTableHead columnKey="debit" width={getColumnWidth?.("debit")} onResize={onColumnResize} className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.debit")}
              </ResizableTableHead>
            )}
            {visibleColumns.credit && (
              <ResizableTableHead columnKey="credit" width={getColumnWidth?.("credit")} onResize={onColumnResize} className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.credit")}
              </ResizableTableHead>
            )}
            {visibleColumns.status && (
              <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.journal.status")}
              </ResizableTableHead>
            )}
            <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
              {t("accounting.columns.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => {
            const { totalDebit, totalCredit } = getJournalEntryLineTotals(entry);
            return (
              <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                {canDelete && (
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onCheckedChange={() => onToggleSelected(entry.id)}
                      aria-label={t("accounting.trash.selectEntry", { ref: entry.ref })}
                    />
                  </td>
                )}
                {visibleColumns.ref && (
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-primary">{entry.ref}</span>
                    {entry.reversed_ref && <p className="text-xs text-warning font-semibold m-0">{t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}</p>}
                    {entry.simple_mode && <span className="text-xs text-primary/60 font-semibold m-0">{t("accounting.journal.dashboard.simpleMode")}</span>}
                  </td>
                )}
                {visibleColumns.date && (
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                )}
                {visibleColumns.description && (
                  <td className="px-3 py-2.5 text-foreground max-w-[12.5rem] truncate">{entry.description}</td>
                )}
                {visibleColumns.tags && (
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(entry.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          {getJournalTagLabel(tag, t)}
                        </span>
                      ))}
                      {(entry.tags || []).length > 2 && <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>}
                    </div>
                  </td>
                )}
                {visibleColumns.debit && (
                  <td className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-info">
                    {formatAmount(totalDebit)}
                  </td>
                )}
                {visibleColumns.credit && (
                  <td className="px-3 py-2.5 text-end font-mono text-xs font-semibold text-success">
                    {formatAmount(totalCredit)}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-3 py-2.5"><StatusBadge status={entry.status} config={journalStatusConfig} size="sm" /></td>
                )}
                <td className="px-3 py-2.5 text-end">
                  {renderEntryActions(entry)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-border bg-muted/30">
          <tr>
            <td colSpan={visibleLeadingColumnCount || 1} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
              {entriesCountLabel}
            </td>
            {visibleColumns.debit && (
              <td className="px-3 py-2 text-end font-mono font-bold text-info text-xs">
                {formatAmount(grandDebit)}
              </td>
            )}
            {visibleColumns.credit && (
              <td className="px-3 py-2 text-end font-mono font-bold text-success text-xs">
                {formatAmount(grandCredit)}
              </td>
            )}
            <td colSpan={(visibleColumns.status ? 1 : 0) + 1} className="px-3 py-2 text-end text-xs font-semibold text-muted-foreground">
              {balanced ? (
                <span className="text-success">{t("accounting.journal.dashboard.balanced")}</span>
              ) : (
                <span className="text-destructive">
                  {t("accounting.journal.dashboard.difference", { diff: getJournalBalanceDifference(grandDebit, grandCredit, formatAmount) })}
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
