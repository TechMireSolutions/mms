import React, { useMemo, useState } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { AlertCircle, DollarSign, Tag, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceInvoicesPaginated, useFinanceMetrics } from "@/tenant/hooks/collections/finance";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import {
  FinancialMonthFilterBanner,
  FinancialReportCharts,
  type DiscountUsageByTypeItem,
  type MonthlyFeeCollectionItem,
} from "./FinancialReportSections";
import { FinancialDashboardWidgets, FinancialInvoiceTable } from "./FinancialReportTable";
import { formatMonthYear, getCollectedAmountForInvoice, getOutstandingAmountForInvoice } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";

/** Active filter state passed down from the parent report view. */
interface FinancialReportFilters {
  /** Invoice status to filter by, or "all" for no filter. */
  status: string;
  /** Substring to match against student names (case-insensitive). */
  student: string;
}

/** Props for the FinancialReport component. */
interface FinancialReportProps {
  /** Active report filters. */
  filters: FinancialReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

/**
 * Renders the financial reports and charts including revenue trends,
 * collection rates, discount distribution, and a filterable invoice table.
 *
 * @param props - The component props.
 * @returns The FinancialReport component.
 */
const FinancialReport = React.memo(function FinancialReport({ filters }: FinancialReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const palette = useBrandPalette();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2], palette.charts[3], palette.charts[0]],
    [palette],
  );
  const financeInvoices = useFinanceInvoicesPaginated({ page: 1, limit: 500 }).data?.invoices ?? [];
  const { data: financeMetrics } = useFinanceMetrics();

  const monthlyFeeCollection = useMemo<MonthlyFeeCollectionItem[]>(() => {
    // Generate monthly aggregation
    const monthlyTotals: Record<string, { collected: number, outstanding: number, total: number }> = {};
    financeInvoices.forEach((invoice) => {
      // Use due date or creation date for month bucket (mocking logic using due date)
      const dueDate = new Date(invoice.dueDate);
      if (isNaN(dueDate.getTime())) return;
      const monthLabel = formatMonthYear(dueDate);
      
      if (!monthlyTotals[monthLabel]) monthlyTotals[monthLabel] = { collected: 0, outstanding: 0, total: 0 };
      
      const collected = getCollectedAmountForInvoice(invoice);
      const outstanding = getOutstandingAmountForInvoice(invoice);
      
      monthlyTotals[monthLabel].collected += collected;
      monthlyTotals[monthLabel].outstanding += outstanding;
      monthlyTotals[monthLabel].total += invoice.finalAmt;
    });

    return Object.entries(monthlyTotals).map(([month, monthTotals]) => ({
      month,
      collected: monthTotals.collected,
      outstanding: monthTotals.outstanding,
      total: monthTotals.total,
      rate: monthTotals.total > 0 ? Math.round((monthTotals.collected / monthTotals.total) * 100) : 0
    })).sort((firstMonth, secondMonth) => new Date(firstMonth.month).getTime() - new Date(secondMonth.month).getTime()).slice(-6); // Last 6 months
  }, [financeInvoices]);

  const discountUsageByType = useMemo<DiscountUsageByTypeItem[]>(() => {
    const discountTotalsByType: Record<string, { count: number, totalDiscounted: number }> = {};
    let totalDiscountAmount = 0;

    financeInvoices.forEach((invoice) => {
      if (invoice.discountAmt > 0 && invoice.discountType && invoice.status !== "cancelled") {
        const discountType = invoice.discountType;
        if (!discountTotalsByType[discountType]) discountTotalsByType[discountType] = { count: 0, totalDiscounted: 0 };
        discountTotalsByType[discountType].count++;
        discountTotalsByType[discountType].totalDiscounted += invoice.discountAmt;
        totalDiscountAmount += invoice.discountAmt;
      }
    });

    return Object.entries(discountTotalsByType).map(([discountType, discountTotals]) => ({
      type: discountType,
      count: discountTotals.count,
      totalDiscounted: discountTotals.totalDiscounted,
      percentage: totalDiscountAmount > 0 ? Math.round((discountTotals.totalDiscounted / totalDiscountAmount) * 100) : 0
    }));
  }, [financeInvoices]);

  const totalCollected = financeMetrics?.collectedTotal
    ?? monthlyFeeCollection.reduce((total, monthTotals) => total + monthTotals.collected, 0);
  const totalOutstanding = financeMetrics?.outstandingBalance
    ?? monthlyFeeCollection.reduce((total, monthTotals) => total + monthTotals.outstanding, 0);
  const totalDiscounted = financeMetrics?.discountTotal
    ?? discountUsageByType.reduce((total, discountTotals) => total + discountTotals.totalDiscounted, 0);

  const kpiItems = useMemo(() => [
    { icon: DollarSign, label: t("finance.report.totalCollected"), value: formatCurrency(totalCollected), accent: "green" as const },
    { icon: AlertCircle, label: t("finance.report.outstanding"), value: formatCurrency(totalOutstanding), accent: "red" as const },
    { icon: TrendingUp, label: t("finance.report.netRevenue"), value: formatCurrency(totalCollected - totalOutstanding), accent: "primary" as const },
    { icon: Tag, label: t("finance.report.totalDiscounted"), value: formatCurrency(totalDiscounted), accent: "amber" as const },
  ], [t, formatCurrency, totalCollected, totalOutstanding, totalDiscounted]);

  const invoices = useMemo(() => {
    let filteredInvoices = financeInvoices;
    if (filters.status !== "all") {
      filteredInvoices = filteredInvoices.filter((invoice) => invoice.status === filters.status);
    }
    if (filters.student) {
      filteredInvoices = filteredInvoices.filter((invoice) =>
        invoice.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    if (selectedMonth) {
      filteredInvoices = filteredInvoices.filter((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        if (isNaN(dueDate.getTime())) return false;
        return formatMonthYear(dueDate) === selectedMonth;
      });
    }
    return filteredInvoices;
  }, [filters, financeInvoices, selectedMonth]);

  const toggleMonthFilter = (month: string) => {
    setSelectedMonth((current) => (current === month ? null : month));
  };

  return (
    <div className="space-y-4">
      <ModuleCommandMetricsGrid items={kpiItems} />

      <FinancialReportCharts
        monthlyFeeCollection={monthlyFeeCollection}
        discountUsageByType={discountUsageByType}
        pieColors={PIE_COLORS}
        selectedMonth={selectedMonth}
        onToggleMonthFilter={toggleMonthFilter}
      />
      <FinancialMonthFilterBanner selectedMonth={selectedMonth} onClear={() => setSelectedMonth(null)} />
      <FinancialInvoiceTable invoices={invoices} />
      <FinancialDashboardWidgets />
    </div>
  );
});

export default FinancialReport;
