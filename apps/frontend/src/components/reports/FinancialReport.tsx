import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { DollarSign, TrendingUp, AlertCircle, Tag } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { Invoice } from '@/lib/data/financeData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

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
const PKR = (n: number): string => `PKR ${Number(n).toLocaleString()}`;

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
  const palette = useBrandPalette();
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2], palette.charts[3], palette.charts[0]],
    [palette],
  );
  const financeInvoices = useLiveCollection<Invoice>("finance_invoices");

  const feeCollection = useMemo(() => {
    // Generate monthly aggregation
    const months: Record<string, { collected: number, outstanding: number, total: number }> = {};
    financeInvoices.forEach(inv => {
      // Use due date or creation date for month bucket (mocking logic using due date)
      const d = new Date(inv.dueDate);
      if (isNaN(d.getTime())) return;
      const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      if (!months[monthStr]) months[monthStr] = { collected: 0, outstanding: 0, total: 0 };
      
      months[monthStr].total += inv.finalAmt;
      if (inv.status === "paid") {
        months[monthStr].collected += inv.finalAmt;
      } else if (inv.status === "partial") {
        const paid = inv.paidAmt !== undefined ? inv.paidAmt : Math.round(inv.finalAmt / 2);
        months[monthStr].collected += paid;
        months[monthStr].outstanding += (inv.finalAmt - paid);
      } else if (inv.status !== "cancelled") {
        months[monthStr].outstanding += inv.finalAmt;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      collected: data.collected,
      outstanding: data.outstanding,
      total: data.total,
      rate: data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()).slice(-6); // Last 6 months
  }, [financeInvoices]);

  const discountUsage = useMemo(() => {
    const discounts: Record<string, { count: number, totalDiscounted: number }> = {};
    let totalAllDiscounts = 0;

    financeInvoices.forEach(inv => {
      if (inv.discountAmt > 0 && inv.discountType && inv.status !== "cancelled") {
        const type = inv.discountType;
        if (!discounts[type]) discounts[type] = { count: 0, totalDiscounted: 0 };
        discounts[type].count++;
        discounts[type].totalDiscounted += inv.discountAmt;
        totalAllDiscounts += inv.discountAmt;
      }
    });

    return Object.entries(discounts).map(([type, data]) => ({
      type,
      count: data.count,
      totalDiscounted: data.totalDiscounted,
      pct: totalAllDiscounts > 0 ? Math.round((data.totalDiscounted / totalAllDiscounts) * 100) : 0
    }));
  }, [financeInvoices]);

  const totalCollected = feeCollection.reduce((a, m) => a + m.collected, 0);
  const totalOutstanding = feeCollection.reduce((a, m) => a + m.outstanding, 0);
  const totalDiscounted = discountUsage.reduce((a, d) => a + d.totalDiscounted, 0);

  const invoices = useMemo(() => {
    let list = financeInvoices;
    if (filters.status !== "all") {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters.student) {
      list = list.filter((i) =>
        i.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return list;
  }, [filters, financeInvoices]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={DollarSign}  label="Total Collected"  value={PKR(totalCollected)}                   color="green"   />
        <ReportSummaryCard icon={AlertCircle} label="Outstanding"      value={PKR(totalOutstanding)}                 color="red"     />
        <ReportSummaryCard icon={TrendingUp}  label="Net Revenue"      value={PKR(totalCollected - totalOutstanding)} color="primary" />
        <ReportSummaryCard icon={Tag}         label="Total Discounted" value={PKR(totalDiscounted)}                  color="amber"   />
      </div>

      {/* Revenue trend */}
      <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-3">Monthly Collection vs Outstanding</p>
        <SafeResponsiveContainer width="100%" height={200}>
          <AreaChart data={feeCollection}>
            <defs>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => v !== undefined ? PKR(Number(v)) : ""} />
            <Area type="monotone" dataKey="collected"   stroke="hsl(var(--primary))" fill="url(#colorCollected)" strokeWidth={2} name="Collected"   />
            <Area type="monotone" dataKey="outstanding" stroke={palette.charts[0]} fill="transparent" strokeWidth={2} strokeDasharray="4 2" name="Outstanding" />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>

      {/* Two-column: collection table + discount pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Collection Rate by Month</p>
          <div className="space-y-2">
            {feeCollection.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{m.month}</span>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${m.rate}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Discount Distribution</p>
          <SafeResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={discountUsage}
                dataKey="totalDiscounted"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {discountUsage.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
        title="Invoice Report" 
        data={invoices}
        headers={["Invoice", "Student", "Class", "Base Fee", "Discount", "Final", "Due Date", "Status"]}
      />
      {invoices.length === 0 ? (
        <EmptyState icon={DollarSign} title="No invoices match filters" compact />
      ) : (
        <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Invoice", "Student", "Class", "Base Fee", "Discount", "Final", "Due Date", "Status"].map((h) => (
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
                      {inv.status}
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
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dashboard Main Widgets</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Preview of widgets rendering on the main landing dashboard</p>
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
