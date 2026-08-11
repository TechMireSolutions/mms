import { formatDate } from "@mms/shared";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { FLOW_TONE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import type { CashbookRow } from "@/tenant/features/accounting/components/cashbookViewShared";

interface CashbookViewTableProps {
  rows: CashbookRow[];
  totalIn: number;
  totalOut: number;
  formatCurrency: (amount: number) => string;
}

export function CashbookViewTable({ rows, totalIn, totalOut, formatCurrency }: CashbookViewTableProps) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <EmptyState variant="dashed" title={t("accounting.cashbook.noTransactions")} compact />
    );
  }

  const flowBadge = (row: CashbookRow) => (
    <StatusBadge
      status={row.flowType}
      size="sm"
      config={{
        in: { label: row.flowLabel, cls: FLOW_TONE.in.badge },
        out: { label: row.flowLabel, cls: FLOW_TONE.out.badge },
        transfer: { label: row.flowLabel, cls: SEMANTIC_BADGE.infoStrong },
      }}
    />
  );

  const flowIcon = (flowType: CashbookRow["flowType"]) => {
    if (flowType === "in") return <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />;
    if (flowType === "out") return <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" aria-hidden="true" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-info shrink-0" aria-hidden="true" />;
  };

  return (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
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
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-success">{t("accounting.cashbook.moneyIn")}</dt>
                <dd className="font-mono font-bold text-success">
                  {row.flowType === "in" ? formatCurrency(row.flowAmount) : <span className="text-muted-foreground/30 font-normal">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-destructive">{t("accounting.cashbook.moneyOut")}</dt>
                <dd className="font-mono font-bold text-destructive">
                  {row.flowType === "out" ? formatCurrency(row.flowAmount) : <span className="text-muted-foreground/30 font-normal">—</span>}
                </dd>
              </div>
            </dl>
          </article>
        ))}
        <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("accounting.cashbook.transactionCount", { count: rows.length })}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-success">{t("accounting.cashbook.moneyIn")}</dt>
              <dd className="font-mono font-bold text-success text-xs">{formatCurrency(totalIn)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-destructive">{t("accounting.cashbook.moneyOut")}</dt>
              <dd className="font-mono font-bold text-destructive text-xs">{formatCurrency(totalOut)}</dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("accounting.cashbook.tableCaption")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="date" className="px-3 py-2.5">{t("accounting.columns.journal.date")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="type" className="px-3 py-2.5">{t("accounting.columns.journal.type")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="description" className="px-3 py-2.5">{t("accounting.columns.journal.description")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="moneyIn" className="px-3 py-2.5 text-end text-success">{t("accounting.cashbook.moneyIn")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="moneyOut" className="px-3 py-2.5 text-end text-destructive">{t("accounting.cashbook.moneyOut")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.date)}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <div className="inline-flex items-center gap-1.5">
                    {flowIcon(row.flowType)}
                    {flowBadge(row)}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-foreground max-w-[12.5rem] truncate">
                  <p className="font-medium m-0">{row.description}</p>
                  <p className="text-xs text-muted-foreground font-mono m-0">{row.ref}</p>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-end">
                  {row.flowType === "in" ? (
                    <span className="font-mono font-bold text-success">{formatCurrency(row.flowAmount)}</span>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-end">
                  {row.flowType === "out" ? (
                    <span className="font-mono font-bold text-destructive">{formatCurrency(row.flowAmount)}</span>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("accounting.cashbook.transactionCount", { count: rows.length })}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalIn)}</TableCell>
              <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(totalOut)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
