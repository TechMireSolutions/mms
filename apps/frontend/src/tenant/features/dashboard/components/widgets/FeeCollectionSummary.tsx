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
    <section aria-labelledby="fee-collection-heading" className="relative overflow-hidden group/summary bg-card/45 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300">
       <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/summary:bg-primary" />
      <header className="flex items-start justify-between mb-5 pl-1.5">
        <div>
          <h3 id="fee-collection-heading" className="text-sm font-semibold text-foreground m-0">
            {title || t("dashboard.widgets.feeCollectionSummary")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">{displayDate}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground m-0">{formatCurrency(totalCollected)}</p>
          <div className="flex items-center gap-1 text-success justify-end">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span className="text-[11px] font-semibold">
              {t("dashboard.widgets.comparisonTrend", { value: 11, month: comparisonMonthName })}
            </span>
          </div>
        </div>
      </header>

      {/* Stacked progress bar */}
      <div className="h-3 rounded-full overflow-hidden bg-muted flex mb-3" aria-hidden="true">
        <div className="bg-success h-full transition-all duration-700" style={{ width: `${collectedPct}%` }} />
        <div className="bg-destructive h-full transition-all duration-700" style={{ width: `${outstandingPct}%` }} />
      </div>
      <div className="flex items-center gap-4 mb-5" aria-label={`Collected: ${collectedPct}%, Outstanding: ${outstandingPct}%`}>
        {breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${b.color}`} aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground">{b.label}</span>
            <span className="text-[11px] font-semibold text-foreground">{b.pct}%</span>
          </div>
        ))}
      </div>

      {/* By-class breakdown */}
      <div className="space-y-3">
        {byClass.map((classSummary) => {
          const pct = classSummary.target > 0 ? Math.round((classSummary.collected / classSummary.target) * 100) : 0;
          return (
            <article key={classSummary.name}>
              <header className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-foreground font-medium">{classSummary.name}</span>
                <span className="text-[12px] text-muted-foreground">
                  {formatCurrency(classSummary.collected)} / {formatCurrency(classSummary.target)}
                </span>
              </header>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-label={`${classSummary.name} collection is at ${pct}%`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
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
  );
}
