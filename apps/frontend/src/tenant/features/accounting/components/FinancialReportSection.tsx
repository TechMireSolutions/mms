import React from "react";
import { motion } from "framer-motion";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";

export interface ReportRow {
  id: string;
  name: string;
  code: string;
  type: string;
  subtype?: string;
  totalDebit: number;
  totalCredit: number;
}

interface ReportSectionProps {
  title: string;
  rows: ReportRow[];
  totalLabel: string;
  total: number;
  debitNormal: boolean;
  color?: string;
}

export function ReportSection({
  title,
  rows,
  totalLabel,
  total,
  debitNormal,
  color,
}: ReportSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const maxAmount = Math.max(
    ...rows.map((reportRow) => {
      const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
      return Math.abs(rowAmount);
    }),
    1,
  );

  return (
    <section aria-label={title} className="rounded-xl border border-border overflow-hidden">
      <header className={`px-4 py-2.5 border-b border-border ${color || "bg-muted/60"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground m-0">{title}</h3>
      </header>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((reportRow, index) => {
          const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
          const percentage = (Math.abs(rowAmount) / maxAmount) * 100;
          return (
            <motion.article
              key={reportRow.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="space-y-2 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium text-foreground">{reportRow.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono m-0">
                    {reportRow.code} · {reportRow.subtype || reportRow.type}
                  </p>
                </div>
                <span className="shrink-0 font-mono font-semibold text-foreground">{formatCurrency(Math.abs(rowAmount))}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </motion.article>
          );
        })}
        <article className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
          <span className="font-bold text-foreground">{totalLabel}</span>
          <span className="font-mono font-bold text-foreground text-base">{formatCurrency(total)}</span>
        </article>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("accounting.reports.sectionDataCaption", { title })}</caption>
          <tbody className="divide-y divide-border">
            {rows.map((reportRow) => {
              const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
              const percentage = (Math.abs(rowAmount) / maxAmount) * 100;
              return (
                <tr key={reportRow.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{reportRow.name}</span>
                      <span className="font-mono font-semibold text-foreground ms-2">{formatCurrency(Math.abs(rowAmount))}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono m-0">
                      {reportRow.code} · {reportRow.subtype || reportRow.type}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td className="px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold text-foreground">{totalLabel}</span>
                <span className="font-mono font-bold text-foreground text-base">{formatCurrency(total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
