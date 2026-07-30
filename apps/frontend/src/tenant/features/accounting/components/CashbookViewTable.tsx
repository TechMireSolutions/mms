import { formatDate } from "@mms/shared";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      <div className="py-16 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border" role="status">
        {t("accounting.cashbook.noTransactions")}
      </div>
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
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("accounting.cashbook.tableCaption")}</caption>
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.date")}</th>
              <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.type")}</th>
              <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.columns.journal.description")}</th>
              <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-success uppercase">{t("accounting.cashbook.moneyIn")}</th>
              <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-destructive uppercase">{t("accounting.cashbook.moneyOut")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.date)}</td>
                <td className="px-3 py-3">
                  <div className="inline-flex items-center gap-1.5">
                    {flowIcon(row.flowType)}
                    {flowBadge(row)}
                  </div>
                </td>
                <td className="px-3 py-3 text-foreground max-w-[12.5rem] truncate">
                  <p className="font-medium m-0">{row.description}</p>
                  <p className="text-xs text-muted-foreground font-mono m-0">{row.ref}</p>
                </td>
                <td className="px-3 py-3 text-end">
                  {row.flowType === "in" ? (
                    <span className="font-mono font-bold text-success">{formatCurrency(row.flowAmount)}</span>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </td>
                <td className="px-3 py-3 text-end">
                  {row.flowType === "out" ? (
                    <span className="font-mono font-bold text-destructive">{formatCurrency(row.flowAmount)}</span>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={3} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.cashbook.transactionCount", { count: rows.length })}</td>
              <td className="px-3 py-2 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalIn)}</td>
              <td className="px-3 py-2 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(totalOut)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
