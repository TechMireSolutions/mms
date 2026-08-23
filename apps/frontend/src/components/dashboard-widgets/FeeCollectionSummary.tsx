import React, { useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LegendChip } from "@/components/ui/LegendChip";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useFinanceInvoicesPaginated } from "@/tenant/hooks/collections/finance";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMonthYear, formatMonthName, getCollectedAmountForMonth, getOutstandingAmountForMonth } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { percentChange } from "@/tenant/features/dashboard/hooks/dashboardMetricTrends";

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
  const invoices = useFinanceInvoicesPaginated({ page: 1, limit: 500 }).data?.invoices ?? [];
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
        const className = inv.class || t("common.other");
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
  }, [invoices, currentYear, currentMonth, t]);

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

  const changePct = useMemo(() => percentChange(totalCollected, prevCollected), [totalCollected, prevCollected]);

  const displayTrendPct = Math.abs(changePct);
  const isPositiveTrend = changePct >= 0;

  return (
    <WidgetCard ariaLabelledby="fee-collection-heading" accentColor="primary">
      <WidgetCardHeader
        variant="tinted"
        headingId="fee-collection-heading"
        title={title || t("dashboard.widgets.feeCollectionSummary")}
        subtitle={displayDate}
        actions={
          <div className="text-end shrink-0">
            <p className="text-base font-black text-foreground m-0 tabular-nums">{formatCurrency(totalCollected)}</p>
            <div className={`flex items-center gap-1 justify-end mt-0.5 ${isPositiveTrend ? "text-success" : "text-destructive"}`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span className="text-xs font-bold">
                {t("dashboard.widgets.comparisonTrend", { value: displayTrendPct, month: comparisonMonthName })}
              </span>
            </div>
          </div>
        }
      />

      <section className="p-5 space-y-4">
        {/* Stacked progress bar */}
        <div className="h-3 rounded-full overflow-hidden bg-muted flex mb-4.5 shadow-inner" aria-hidden="true">
          <div className="bg-success h-full transition-all duration-700 ease-out" style={{ width: `${collectedPct}%` }} />
          <div className="bg-destructive h-full transition-all duration-700 ease-out" style={{ width: `${outstandingPct}%` }} />
        </div>
        <div
          className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 select-none"
          aria-label={t("dashboard.widgets.feeSplitAria", { collected: collectedPct, outstanding: outstandingPct })}
        >
          {breakdown.map((b) => (
            <LegendChip
              key={b.label}
              dotClassName={b.color}
              label={b.label}
              labelClassName="text-muted-foreground font-medium"
              value={`${b.pct}%`}
            />
          ))}
        </div>

        {/* By-class breakdown */}
        <div className="space-y-4">
          {byClass.map((classSummary) => {
            const pct = classSummary.target > 0 ? Math.round((classSummary.collected / classSummary.target) * 100) : 0;
            return (
              <article key={classSummary.name} className="space-y-1.5">
                <header className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-foreground font-semibold">{classSummary.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground font-medium tabular-nums">
                    {formatCurrency(classSummary.collected)} / {formatCurrency(classSummary.target)}
                  </span>
                </header>
                <ProgressBar
                  value={pct}
                  size="md"
                  fillClassName={`${
                    pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive"
                  } duration-700 ease-out`}
                  aria-label={t("dashboard.widgets.classCollectionAria", { name: classSummary.name, pct })}
                />
              </article>
            );
          })}
        </div>
      </section>
    </WidgetCard>
  );
}
