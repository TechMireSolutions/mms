import { useMemo } from "react";
import { formatDate } from "@mms/shared";
import { TrendingUp, TrendingDown, ArrowUpDown, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work/WorkBatchTable";
import { FLOW_TONE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { CashbookRow } from "@/tenant/features/accounting/components/cashbookViewShared";

interface CashbookViewTableProps {
  rows: CashbookRow[];
  totalIn: number;
  totalOut: number;
  formatCurrency: (amount: number) => string;
  viewMode?: WorkDirectoryViewMode;
}

export function CashbookViewTable({
  rows,
  totalIn,
  totalOut,
  formatCurrency,
  viewMode: propViewMode,
}: CashbookViewTableProps) {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;



  const flowBadge = (row: CashbookRow) => (
    <StatusBadge
      status={row.flowType}
      size="sm"
      config={{
        in: { label: row.flowLabel, cls: FLOW_TONE.in.badge },
        out: { label: row.flowLabel, cls: FLOW_TONE.out.badge },
        transfer: { label: row.flowLabel, cls: SEMANTIC_BADGE.infoStrong },
        // A posted entry with no cash/bank line cannot be reported as money in
        // or out; the row says "Unclassified" instead of showing "—" in both
        // money columns with no explanation.
        unclassified: {
          label: row.flowLabel || t("accounting.cashbook.unclassified"),
          cls: SEMANTIC_BADGE.warningStrong,
        },
      }}
    />
  );

  const flowIcon = (flowType: CashbookRow["flowType"]) => {
    if (flowType === "in") return <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />;
    if (flowType === "out") return <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" aria-hidden="true" />;
    if (flowType === "unclassified") return <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" aria-hidden="true" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-info shrink-0" aria-hidden="true" />;
  };
  
  const batchColumns = useMemo<WorkBatchTableColumn<CashbookRow>[]>(() => [
    {
      id: "date",
      label: t("accounting.columns.journal.date"),
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      render: (row) => formatDate(row.date),
    },
    {
      id: "type",
      label: t("accounting.columns.journal.type"),
      render: (row) => (
        <div className="inline-flex items-center gap-1.5">
          {flowIcon(row.flowType)}
          {flowBadge(row)}
        </div>
      ),
    },
    {
      id: "description",
      label: t("accounting.columns.journal.description"),
      cellClassName: "text-foreground max-w-cell-trunc truncate",
      render: (row) => (
        <>
          <p className="font-medium m-0">{row.description}</p>
          <p className="text-xs text-muted-foreground font-mono m-0">{row.ref}</p>
        </>
      ),
    },
    {
      id: "moneyIn",
      label: t("accounting.cashbook.moneyIn"),
      headerClassName: "text-end text-success",
      cellClassName: "text-end",
      render: (row) => row.flowType === "in" ? (
        <span className="font-mono font-bold text-success">{formatCurrency(row.flowAmount)}</span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "moneyOut",
      label: t("accounting.cashbook.moneyOut"),
      headerClassName: "text-end text-destructive",
      cellClassName: "text-end",
      render: (row) => row.flowType === "out" ? (
        <span className="font-mono font-bold text-destructive">{formatCurrency(row.flowAmount)}</span>
      ) : <span className="text-muted-foreground">—</span>,
    }
  ], [t, formatCurrency]);

  if (rows.length === 0) {
    return (
      <EmptyState variant="dashed" title={t("accounting.cashbook.noTransactions")} compact />
    );
  }

  if (viewMode === "cards") {
    return (
      <div className={WORK_SURFACE}>
        <DirectoryCardsGrid className="p-3">
          {rows.map((row) => (
            <DirectoryEntityCard key={row.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground m-0">{formatDate(row.date)}</p>
                  <h4 className="font-medium text-sm text-foreground m-0 mt-0.5">{row.description}</h4>
                  <p className="text-xs text-muted-foreground font-mono m-0">{row.ref}</p>
                </div>
                <div className="inline-flex shrink-0 items-center gap-1.5">
                  {flowIcon(row.flowType)}
                  {flowBadge(row)}
                </div>
              </div>
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
            </DirectoryEntityCard>
          ))}
          <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 col-span-full">
            <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("accounting.cashbook.transactionCount", { count: rows.length })}</p>
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
          </article>
        </DirectoryCardsGrid>
      </div>
    );
  }

  return (
    <WorkBatchTable
      data={rows}
      columns={batchColumns}
      caption={t("accounting.cashbook.tableCaption")}
      tableFooter={
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("accounting.cashbook.transactionCount", { count: rows.length })}</TableCell>
            <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalIn)}</TableCell>
            <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(totalOut)}</TableCell>
          </TableRow>
        </TableFooter>
      }
    />
  );
}
