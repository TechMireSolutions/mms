import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useFinanceInvoicesCollection } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMonthYear, formatMonthName } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import type { Invoice } from "@/lib/data/financeData";

function getCollectedAmountForMonth(invoices: Invoice[], year: number, month: number): number {
  let sum = 0;
  invoices.forEach((inv) => {
    if (!inv || inv.status === "cancelled") return;
    const dateStr = inv.paidDate || inv.dueDate || "";
    if (!dateStr) return;
    const invYear = Number(dateStr.slice(0, 4));
    const invMonth = Number(dateStr.slice(5, 7)) - 1;
    if (invYear === year && invMonth === month) {
      if (inv.status === "paid") {
        sum += inv.finalAmt;
      } else if (inv.status === "partial") {
        sum += inv.paidAmt || 0;
      }
    }
  });
  return sum;
}

function getOutstandingAmountForMonth(invoices: Invoice[], year: number, month: number): number {
  let sum = 0;
  invoices.forEach((inv) => {
    if (!inv || inv.status === "cancelled" || inv.status === "paid") return;
    const dateStr = inv.dueDate || "";
    if (!dateStr) return;
    const invYear = Number(dateStr.slice(0, 4));
    const invMonth = Number(dateStr.slice(5, 7)) - 1;
    if (invYear === year && invMonth === month) {
      const outstanding = inv.status === "partial" ? (inv.finalAmt - (inv.paidAmt || 0)) : inv.finalAmt;
      sum += outstanding;
    }
  });
  return sum;
}

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

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevMonthDate = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1);
  }, [currentYear, currentMonth]);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  // Calculate overall metrics for current month
  const totalCollected = useMemo(
    () => getCollectedAmountForMonth(invoices, currentYear, currentMonth),
    [invoices, currentYear, currentMonth]
  );
  const totalOutstanding = useMemo(
    () => getOutstandingAmountForMonth(invoices, currentYear, currentMonth),
    [invoices, currentYear, currentMonth]
  );

  const totalTarget = totalCollected + totalOutstanding;
  const collectedPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;
  const outstandingPct = totalTarget > 0 ? (100 - collectedPct) : 0;

  const breakdown = [
    { label: t("finance.report.collected"),   value: totalCollected, total: totalTarget, color: "bg-success", pct: collectedPct },
    { label: t("finance.report.outstanding"), value: totalOutstanding,  total: totalTarget, color: "bg-destructive",     pct: outstandingPct },
  ];

  // Group by Class for current month
  const classMap = useMemo(() => {
    const map: Record<string, { name: string; collected: number; target: number }> = {};
    invoices.forEach((inv) => {
      if (!inv || inv.status === "cancelled") return;
      const dateStr = inv.paidDate || inv.dueDate || "";
      if (!dateStr) return;
      const invYear = Number(dateStr.slice(0, 4));
      const invMonth = Number(dateStr.slice(5, 7)) - 1;
      
      if (invYear === currentYear && invMonth === currentMonth) {
        const className = inv.class || "Other";
        if (!map[className]) {
          map[className] = { name: className, collected: 0, target: 0 };
        }
        map[className].target += inv.finalAmt;
        if (inv.status === "paid") {
          map[className].collected += inv.finalAmt;
        } else if (inv.status === "partial") {
          map[className].collected += inv.paidAmt || 0;
        }
      }
    });
    return map;
  }, [invoices, currentYear, currentMonth]);

  const byClass = useMemo(() => Object.values(classMap), [classMap]);

  const displayDate = useMemo(() => {
    return formatMonthYear(now, "long");
  }, [now]);

  const comparisonMonthName = useMemo(() => {
    return formatMonthName(prevMonthDate);
  }, [prevMonthDate]);

  const prevCollected = useMemo(
    () => getCollectedAmountForMonth(invoices, prevYear, prevMonth),
    [invoices, prevYear, prevMonth]
  );

  const changePct = useMemo(() => {
    if (prevCollected > 0) {
      return Math.round(((totalCollected - prevCollected) / prevCollected) * 100);
    }
    return totalCollected > 0 ? 100 : 0;
  }, [totalCollected, prevCollected]);

  const displayTrendPct = Math.abs(changePct);
  const isPositiveTrend = changePct >= 0;

  return (
    <section aria-labelledby="fee-collection-heading" className="relative overflow-hidden group rounded-2xl surface-glass shadow-sm hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left">
      <div className="absolute inset-inline-start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-border/45 bg-muted/10 pl-6.5 select-none">
        <div className="flex-1 min-w-0">
          <h3 id="fee-collection-heading" className="text-sm font-bold text-foreground m-0 truncate">
            {title || t("dashboard.widgets.feeCollectionSummary")}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 m-0 font-medium">{displayDate}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-black text-foreground m-0 tabular-nums">{formatCurrency(totalCollected)}</p>
          <div className={`flex items-center gap-1 justify-end mt-0.5 ${isPositiveTrend ? "text-success" : "text-destructive"}`}>
            {isPositiveTrend ? (
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span className="text-[10px] font-bold">
              {t("dashboard.widgets.comparisonTrend", { value: displayTrendPct, month: comparisonMonthName })}
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
