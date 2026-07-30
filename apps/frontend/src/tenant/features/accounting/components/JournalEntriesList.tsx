import type React from "react";
import { formatDate, type AppTranslationKey } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { JournalEntry } from "@/lib/data/accountingData";

interface JournalEntriesVisibleColumns {
  ref: boolean;
  date: boolean;
  description: boolean;
  tags: boolean;
  debit: boolean;
  credit: boolean;
  status: boolean;
}

interface JournalEntriesListProps {
  entries: JournalEntry[];
  selectedIds: string[];
  canDelete: boolean;
  allFilteredSelected: boolean;
  visibleColumns: JournalEntriesVisibleColumns;
  journalStatusConfig: Record<string, StatusBadgeConfigItem>;
  grandDebit: number;
  grandCredit: number;
  formatAmount: (amount: number) => string;
  renderEntryActions: (entry: JournalEntry) => React.ReactNode;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function JournalEntriesList({
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
}: JournalEntriesListProps) {
  const { t } = useTranslation();
  const visibleLeadingColumnCount =
    (visibleColumns.ref ? 1 : 0) +
    (visibleColumns.date ? 1 : 0) +
    (visibleColumns.description ? 1 : 0) +
    (visibleColumns.tags ? 1 : 0);
  const entriesCountLabel = entries.length !== 1
    ? t("accounting.journal.dashboard.entriesCount", { count: entries.length })
    : t("accounting.journal.dashboard.entryCount", { count: entries.length });
  const balanceLabel = Math.abs(grandDebit - grandCredit) < 0.01
    ? <span className="text-success">{t("accounting.journal.dashboard.balanced")}</span>
    : <span className="text-destructive">{t("accounting.journal.dashboard.difference", { diff: formatAmount(Math.abs(grandDebit - grandCredit)) })}</span>;

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-border" role="status">
        {t("accounting.journal.dashboard.noEntriesMatch")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {entries.map((entry) => {
          const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
          const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
          return (
            <article key={entry.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {visibleColumns.ref && (
                    <>
                      <p className="font-mono text-xs font-bold text-primary m-0">{entry.ref}</p>
                      {entry.reversed_ref && <p className="text-xs text-warning font-semibold m-0">{t("accounting.journal.dashboard.reversalOf", { ref: entry.reversed_ref })}</p>}
                      {entry.simple_mode && <span className="text-xs text-primary/60 font-semibold">{t("accounting.journal.dashboard.simpleMode")}</span>}
                    </>
                  )}
                  {visibleColumns.description && <h4 className="truncate text-sm font-semibold text-foreground m-0 mt-1">{entry.description}</h4>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {visibleColumns.status && <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />}
                  {canDelete && (
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onCheckedChange={() => onToggleSelected(entry.id)}
                      aria-label={t("accounting.trash.selectEntry", { ref: entry.ref })}
                    />
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {visibleColumns.date && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.date")}</dt>
                    <dd className="text-foreground">{formatDate(entry.date)}</dd>
                  </div>
                )}
                {visibleColumns.tags && (entry.tags || []).length > 0 && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.tags")}</dt>
                    <dd className="flex flex-wrap gap-1">
                      {(entry.tags || []).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {visibleColumns.debit && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                    <dd className="font-mono text-xs font-semibold text-info">{formatAmount(totalDebit)}</dd>
                  </div>
                )}
                {visibleColumns.credit && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                    <dd className="font-mono text-xs font-semibold text-success">{formatAmount(totalCredit)}</dd>
                  </div>
                )}
              </dl>
              <div className="border-t border-border pt-2">
                {renderEntryActions(entry)}
              </div>
            </article>
          );
        })}
        <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-bold text-muted-foreground uppercase m-0">{entriesCountLabel}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {visibleColumns.debit && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.debit")}</dt>
                <dd className="font-mono font-bold text-info text-xs">{formatAmount(grandDebit)}</dd>
              </div>
            )}
            {visibleColumns.credit && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.journal.credit")}</dt>
                <dd className="font-mono font-bold text-success text-xs">{formatAmount(grandCredit)}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs font-semibold text-muted-foreground m-0">{balanceLabel}</p>
        </article>
      </div>

      <div className="hidden overflow-x-auto md:block">
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
              const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
              const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
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
                            {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
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
                {balanceLabel}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
