import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useFinanceInvoicesCollection } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMonthYear, formatMonthName } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";

/**
 * FeeCollectionSummary Component
 *
 * Displays a summary of fee collections for the current month, including
 * a breakdown by class and overall target vs collected metrics.
 *
 * @returns {React.ReactElement} The fee collection summary widget.
 */
export default function FeeCollectionSummary({ title }: { title?: string }) {
  const { t } = useTranslation();
  const invoices = useFinanceInvoicesCollection();
  const { formatCurrency } = useFinanceCurrency();

  // Calculate overall metrics
  let totalCollected = 0;
  let totalOutstanding = 0;

  invoices.forEach((inv) => {
    if (inv.status === "cancelled") return;
    if (inv.status === "paid") {
      totalCollected += inv.finalAmt;
    } else if (inv.status === "partial") {
      totalCollected += inv.paidAmt || 0;
      totalOutstanding += (inv.finalAmt - (inv.paidAmt || 0));
    } else {
      totalOutstanding += inv.finalAmt;
    }
  });

  const totalTarget = totalCollected + totalOutstanding;
  const collectedPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;
  const outstandingPct = totalTarget > 0 ? (100 - collectedPct) : 0;

  const breakdown = [
    { label: t("finance.report.collected"),   value: totalCollected, total: totalTarget, color: "bg-success", pct: collectedPct },
    { label: t("finance.report.outstanding"), value: totalOutstanding,  total: totalTarget, color: "bg-destructive",     pct: outstandingPct },
  ];

  // Group by Class
  const classMap: Record<string, { name: string; collected: number; target: number }> = {};
  invoices.forEach((inv) => {
    if (inv.status === "cancelled") return;
    const className = inv.class || "Other";
    if (!classMap[className]) {
      classMap[className] = { name: className, collected: 0, target: 0 };
    }
    classMap[className].target += inv.finalAmt;
    if (inv.status === "paid") {
      classMap[className].collected += inv.finalAmt;
    } else if (inv.status === "partial") {
      classMap[className].collected += inv.paidAmt || 0;
    }
  });

  const byClass = Object.values(classMap);

  const displayDate = useMemo(() => {
    return formatMonthYear(new Date(), "long");
  }, []);

  const comparisonMonthName = useMemo(() => {
    // March is month index 2 (Mar)
    const comparisonDate = new Date();
    comparisonDate.setMonth(2);
    return formatMonthName(comparisonDate);
  }, []);

  return (
    <section aria-labelledby="fee-collection-heading" className="relative overflow-hidden group rounded-2xl surface-glass shadow-sm hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left">
      <div className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-border/45 bg-muted/10 pl-6.5 select-none">
        <div className="flex-1 min-w-0">
          <h3 id="fee-collection-heading" className="text-sm font-bold text-foreground m-0 truncate">
            {title || t("dashboard.widgets.feeCollectionSummary")}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 m-0 font-medium">{displayDate}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-black text-foreground m-0 tabular-nums">{formatCurrency(totalCollected)}</p>
          <div className="flex items-center gap-1 text-success justify-end mt-0.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[10px] font-bold">
              {t("dashboard.widgets.comparisonTrend", { value: 11, month: comparisonMonthName })}
            </span>
          </div>
        </div>
      </header>

      <section className="p-5 space-y-4">
        {/* Stacked progress bar */}
        <div className="h-3 rounded-full overflow-hidden bg-muted flex mb-4.5 shadow-inner" aria-hidden="true">
          <div className="bg-success h-full transition-all duration-700 ease-out" style={{ width: `${collectedPct}%` }} />
          <div className="bg-destructive h-full transition-all duration-700 ease-out" style={{ width: `${outstandingPct}%` }} />
        </div>
        <div className="flex items-center gap-4 mb-6 select-none" aria-label={`Collected: ${collectedPct}%, Outstanding: ${outstandingPct}%`}>
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${b.color}`} aria-hidden="true" />
              <span className="text-[11px] font-medium text-muted-foreground">{b.label}</span>
              <span className="text-[11px] font-bold text-foreground tabular-nums">{b.pct}%</span>
            </div>
          ))}
        </div>

        {/* By-class breakdown */}
        <div className="space-y-4">
          {byClass.map((classSummary) => {
            const pct = classSummary.target > 0 ? Math.round((classSummary.collected / classSummary.target) * 100) : 0;
            return (
              <article key={classSummary.name} className="space-y-1.5">
                <header className="flex items-center justify-between">
                  <span className="text-[12px] text-foreground font-semibold">{classSummary.name}</span>
                  <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                    {formatCurrency(classSummary.collected)} / {formatCurrency(classSummary.target)}
                  </span>
                </header>
                <div className="h-2 rounded-full bg-muted overflow-hidden" aria-label={`${classSummary.name} collection is at ${pct}%`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
