import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { DollarSign, TrendingUp, AlertCircle, Tag } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceInvoicesCollection } from "@/hooks/useFinanceApi";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import { EmptyState } from "../ui/EmptyState";

import RevenueChart from "@/components/widgets/charts/RevenueChart";
import FeeCollectionSummary from "@/components/widgets/FeeCollectionSummary";
import OutstandingFeesTable from "@/components/widgets/OutstandingFeesTable";
import OverdueObligationsWidget from "@/components/widgets/OverdueObligationsWidget";

/** Invoice status values supported by the financial report. */
type InvoiceStatus = "paid" | "pending" | "overdue" | "partial" | "cancelled";

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

/** Formats a number as a PKR currency string. */
const PKR = (amount: number): string => `PKR ${Number(amount).toLocaleString()}`;

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  paid:      "bg-success/10 text-success",
  pending:   "bg-warning/10 text-warning",
  overdue:   "bg-destructive/10 text-destructive",
  partial:   "bg-info/10 text-info",
  cancelled: "bg-muted text-muted-foreground",
};

/**
 * Renders the financial reports and charts including revenue trends,
 * collection rates, discount distribution, and a filterable invoice table.
 *
 * @param props - The component props.
 * @returns The FinancialReport component.
 */
export default function FinancialReport({ filters }: FinancialReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const palette = useBrandPalette();
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2], palette.charts[3], palette.charts[0]],
    [palette],
  );
  const financeInvoices = useFinanceInvoicesCollection();

  const monthlyFeeCollection = useMemo(() => {
    // Generate monthly aggregation
    const monthlyTotals: Record<string, { collected: number, outstanding: number, total: number }> = {};
    financeInvoices.forEach((invoice) => {
      // Use due date or creation date for month bucket (mocking logic using due date)
      const dueDate = new Date(invoice.dueDate);
      if (isNaN(dueDate.getTime())) return;
      const monthLabel = dueDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      if (!monthlyTotals[monthLabel]) monthlyTotals[monthLabel] = { collected: 0, outstanding: 0, total: 0 };
      
      monthlyTotals[monthLabel].total += invoice.finalAmt;
      if (invoice.status === "paid") {
        monthlyTotals[monthLabel].collected += invoice.finalAmt;
      } else if (invoice.status === "partial") {
        const paidAmount = invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round(invoice.finalAmt / 2);
        monthlyTotals[monthLabel].collected += paidAmount;
        monthlyTotals[monthLabel].outstanding += (invoice.finalAmt - paidAmount);
      } else if (invoice.status !== "cancelled") {
        monthlyTotals[monthLabel].outstanding += invoice.finalAmt;
      }
    });

    return Object.entries(monthlyTotals).map(([month, monthTotals]) => ({
      month,
      collected: monthTotals.collected,
      outstanding: monthTotals.outstanding,
      total: monthTotals.total,
      rate: monthTotals.total > 0 ? Math.round((monthTotals.collected / monthTotals.total) * 100) : 0
    })).sort((firstMonth, secondMonth) => new Date(firstMonth.month).getTime() - new Date(secondMonth.month).getTime()).slice(-6); // Last 6 months
  }, [financeInvoices]);

  const discountUsageByType = useMemo(() => {
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

  const totalCollected = monthlyFeeCollection.reduce((total, monthTotals) => total + monthTotals.collected, 0);
  const totalOutstanding = monthlyFeeCollection.reduce((total, monthTotals) => total + monthTotals.outstanding, 0);
  const totalDiscounted = discountUsageByType.reduce((total, discountTotals) => total + discountTotals.totalDiscounted, 0);

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
    return filteredInvoices;
  }, [filters, financeInvoices]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={DollarSign}  label={t("finance.report.totalCollected")}  value={PKR(totalCollected)}                   color="green"   />
        <ReportSummaryCard icon={AlertCircle} label={t("finance.report.outstanding")}     value={PKR(totalOutstanding)}                 color="red"     />
        <ReportSummaryCard icon={TrendingUp}  label={t("finance.report.netRevenue")}      value={PKR(totalCollected - totalOutstanding)} color="primary" />
        <ReportSummaryCard icon={Tag}         label={t("finance.report.totalDiscounted")} value={PKR(totalDiscounted)}                  color="amber"   />
      </div>

      {/* Revenue trend */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-3">{t("finance.report.chartTitle")}</p>
        <SafeResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyFeeCollection}>
            <defs>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value / 1000}k`} />
            <Tooltip formatter={(value) => value !== undefined ? PKR(Number(value)) : ""} />
            <Area type="monotone" dataKey="collected"   stroke="hsl(var(--primary))" fill="url(#colorCollected)" strokeWidth={2} name={t("finance.report.collected")}   />
            <Area type="monotone" dataKey="outstanding" stroke={palette.charts[0]} fill="transparent" strokeWidth={2} strokeDasharray="4 2" name={t("finance.report.outstandingLabel")} />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>

      {/* Two-column: collection table + discount pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("finance.report.collectionRateTitle")}</p>
          <div className="space-y-2">
            {monthlyFeeCollection.map((monthTotals) => (
              <div key={monthTotals.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{monthTotals.month}</span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${monthTotals.rate}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">{monthTotals.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("finance.report.discountDistributionTitle")}</p>
          <SafeResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={discountUsageByType}
                dataKey="totalDiscounted"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {discountUsageByType.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => v !== undefined ? PKR(Number(v)) : ""} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </SafeResponsiveContainer>
        </div>
      </div>

      {/* Invoice table */}
      <ReportExportBar 
        title={t("finance.report.invoiceReportTitle")} 
        data={invoices}
        headers={[
          t("finance.columns.invoice"),
          t("finance.columns.student"),
          t("finance.report.classColumn"),
          t("finance.columns.baseFee"),
          t("finance.columns.discount"),
          t("finance.columns.final"),
          t("finance.columns.dueDate"),
          t("finance.columns.status"),
        ]}
      />
      {invoices.length === 0 ? (
        <EmptyState icon={DollarSign} title={t("finance.report.noInvoicesMatch")} compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("finance.columns.invoice"),
                  t("finance.columns.student"),
                  t("finance.report.classColumn"),
                  t("finance.columns.baseFee"),
                  t("finance.columns.discount"),
                  t("finance.columns.final"),
                  t("finance.columns.dueDate"),
                  t("finance.columns.status"),
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{inv.id}</td>
                  <td className="px-3 py-2.5 font-medium">{inv.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{inv.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{PKR(inv.baseFee)}</td>
                  <td className="px-3 py-2.5 text-warning">{inv.discountAmt > 0 ? `-${PKR(inv.discountAmt)}` : "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{PKR(inv.finalAmt)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{inv.dueDate}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[inv.status as InvoiceStatus] ?? "bg-muted text-muted-foreground"}`}>
                      {t(`finance.invoiceStatus.${inv.status as InvoiceStatus}` as any)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("finance.report.dashboardWidgetsTitle")}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("finance.report.dashboardWidgetsSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart />
          <FeeCollectionSummary />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OutstandingFeesTable />
          <OverdueObligationsWidget />
        </div>
      </div>
    </div>
  );
}
