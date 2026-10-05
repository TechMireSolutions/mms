import { formatDate } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { ReportMoneyCard } from "@/components/ui/reports/ReportMoneyCard";
import { ReportMoneyCardsGrid } from "@/components/ui/reports/ReportMoneyCardsGrid";
import { ReportMoneySummaryTile } from "@/components/ui/reports/ReportMoneySummaryTile";
import { WorkBatchTable } from "@/components/common/work/WorkBatchTable";
import { resolveVisibleColumns, toColumnResize, type DataTableColumnLayout } from "@/components/common/data-table";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { buildCashbookFooterCells, type CashbookRow } from "@/tenant/features/accounting/components/cashbookViewShared";
import { useCashbookColumns } from "@/tenant/features/accounting/components/useCashbookColumns";

/** ReportMoneyCard tile (report) — not DirectoryCard. */
interface CashbookViewTableProps {
  rows: CashbookRow[];
  totalIn: number;
  totalOut: number;
  formatCurrency: (amount: number) => string;
  viewMode?: WorkDirectoryViewMode;
  /** Page-owned column visibility/order/width (`useModuleColumnLayout`). */
  columnLayout?: DataTableColumnLayout;
}

export function CashbookViewTable({
  rows,
  totalIn,
  totalOut,
  formatCurrency,
  viewMode: propViewMode,
  columnLayout,
}: CashbookViewTableProps) {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  const { columns, flowBadge, flowIcon } = useCashbookColumns(formatCurrency);

  if (rows.length === 0) {
    return (
      <EmptyState variant="dashed" title={t("accounting.cashbook.noTransactions")} compact />
    );
  }

  if (viewMode === "cards") {
    return (
      <ReportMoneyCardsGrid surface>
        {rows.map((row) => (
          <ReportMoneyCard
            key={row.id}
            title={
              <>
                <p className="text-xs text-muted-foreground m-0">{formatDate(row.date)}</p>
                <h4 className="font-medium text-sm text-foreground m-0 mt-0.5">{row.description}</h4>
                <p className="text-xs text-muted-foreground font-mono m-0">{row.ref}</p>
              </>
            }
            end={
              <div className="inline-flex items-center gap-1.5">
                {flowIcon(row.flowType)}
                {flowBadge(row)}
              </div>
            }
          >
            <StatGrid>
              <StatRow
                label={t("accounting.cashbook.moneyIn")}
                value={row.flowType === "in" ? formatCurrency(row.flowAmount) : <span className="text-muted-foreground font-normal">—</span>}
                dtClassName="text-success"
                ddClassName="font-mono font-bold text-success"
              />
              <StatRow
                label={t("accounting.cashbook.moneyOut")}
                value={row.flowType === "out" ? formatCurrency(row.flowAmount) : <span className="text-muted-foreground font-normal">—</span>}
                dtClassName="text-destructive"
                ddClassName="font-mono font-bold text-destructive"
              />
            </StatGrid>
          </ReportMoneyCard>
        ))}
        <ReportMoneySummaryTile label={t("accounting.cashbook.transactionCount", { count: rows.length })}>
          <StatGrid>
            <StatRow
              label={t("accounting.cashbook.moneyIn")}
              value={formatCurrency(totalIn)}
              dtClassName="text-success"
              ddClassName="font-mono font-bold text-success text-xs"
            />
            <StatRow
              label={t("accounting.cashbook.moneyOut")}
              value={formatCurrency(totalOut)}
              dtClassName="text-destructive"
              ddClassName="font-mono font-bold text-destructive text-xs"
            />
          </StatGrid>
        </ReportMoneySummaryTile>
      </ReportMoneyCardsGrid>
    );
  }

  const visibleColumns = columnLayout ? resolveVisibleColumns(columns, columnLayout.columnRegistry) : columns;
  const footerCells = buildCashbookFooterCells(visibleColumns.map((column) => column.id)).map((cell, index) =>
    cell.kind === "label" || cell.kind === "blank" ? (
      <TableCell key={index} colSpan={cell.span} className="table-footer-label">
        {cell.kind === "label" ? t("accounting.cashbook.transactionCount", { count: rows.length }) : null}
      </TableCell>
    ) : (
      <TableCell
        key={index}
        className={`table-amount-cell text-xs ${cell.kind === "moneyIn" ? "text-success" : "text-destructive"}`}
      >
        {formatCurrency(cell.kind === "moneyIn" ? totalIn : totalOut)}
      </TableCell>
    ),
  );

  return (
    <WorkBatchTable
      data={rows}
      columns={visibleColumns}
      caption={t("accounting.cashbook.tableCaption")}
      columnResize={toColumnResize(columnLayout)}
      tableFooter={
        <TableFooter>
          <TableRow>{footerCells}</TableRow>
        </TableFooter>
      }
    />
  );
}
