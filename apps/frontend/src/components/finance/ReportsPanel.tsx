import React, { useMemo, useState } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { motion } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, TooltipContentProps, TooltipPayloadEntry
} from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";
import { MONTHLY_REVENUE, INVOICES } from '@/lib/data/financeData';

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

/**
 * CustomTooltip for Reports Panel.
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
      <p className="font-bold text-foreground mb-1.5 m-0">{label}</p>
      {payload.map((p: TooltipPayloadEntry) => (
        <p key={p.name} style={{ color: p.color }} className="m-0">{p.name}: {fmt(p.value as number)}</p>
      ))}
    </div>
  );
};

interface StudentSummary {
  name: string;
  class: string;
  total: number;
  paid: number;
  count: number;
}

function StudentPaymentHistory() {
  const studentMap: Record<string, StudentSummary> = {};
  INVOICES.forEach((inv) => {
    if (!studentMap[inv.studentName]) {
      studentMap[inv.studentName] = { name: inv.studentName, class: inv.class, total: 0, paid: 0, count: 0 };
    }
    studentMap[inv.studentName].total += inv.finalAmt;
    studentMap[inv.studentName].count += 1;
    if (inv.status === "paid") studentMap[inv.studentName].paid += inv.finalAmt;
    if (inv.status === "partial" && inv.paidAmt) studentMap[inv.studentName].paid += inv.paidAmt;
  });

  const students = Object.values(studentMap);

  return (
    <section aria-label="Student Payment History" className="rounded-xl border border-border overflow-hidden bg-card">
      <header className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-bold text-foreground m-0">Student Payment History</h3>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Student Payment Totals</caption>
          <thead>
            <tr className="border-b border-border/50">
              {["Student", "Class", "Total Invoiced", "Total Paid", "Collection %"].map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {students.map((s, i) => {
              const pct = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;
              return (
                <motion.tr key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-[13px] font-semibold text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{s.class}</td>
                  <td className="px-4 py-3 text-[12px] text-foreground">{fmt(s.total)}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-success">{fmt(s.paid)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" aria-label={`Collection Rate ${pct}%`}>
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden max-w-[80px]" aria-hidden="true">
                        <div
                          className={`h-full rounded-full ${pct === 100 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${pct === 100 ? "text-success" : pct >= 60 ? "text-warning" : "text-destructive"}`}>{pct}%</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Reports Panel component.
 * 
 * Displays revenue charts, invoice distributions, and student payment summaries.
 * 
 * @returns {React.ReactElement}
 */
export default function ReportsPanel() {
  const { primary, secondary, charts } = useBrandPalette();
  const CHART_COLORS = useMemo(() => [primary, secondary, charts[2]], [primary, secondary, charts]);
  const STATUS_DIST = useMemo(
    () => [
      { name: "Paid", value: INVOICES.filter((i) => i.status === "paid").length, color: primary },
      { name: "Pending", value: INVOICES.filter((i) => i.status === "pending").length, color: secondary },
      { name: "Overdue", value: INVOICES.filter((i) => i.status === "overdue").length, color: charts[0] },
      { name: "Partial", value: INVOICES.filter((i) => i.status === "partial").length, color: charts[3] },
    ],
    [primary, secondary, charts],
  );
  const [period, setPeriod] = useState(6);
  const data = MONTHLY_REVENUE.slice(-period);

  return (
    <div className="space-y-6">
      {/* Revenue chart */}
      <section aria-label="Revenue Overview" className="rounded-xl border border-border bg-card p-5">
        <header className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">Revenue Overview</h3>
          </div>
          <nav aria-label="Time period selection" className="flex gap-1.5">
            {[3, 6, 7].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {p}M
              </button>
            ))}
          </nav>
        </header>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" name="Collected" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="outstanding" name="Outstanding" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Line dataKey="expenses" name="Expenses" stroke={charts[0]} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Pie + outstanding side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoice status distribution */}
        <section aria-label="Invoice Status Distribution" className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Invoice Status Distribution</h3>
          <div className="flex items-center gap-6">
            <div aria-hidden="true">
              <PieChart width={130} height={130}>
                <Pie data={STATUS_DIST} dataKey="value" cx={60} cy={60} innerRadius={38} outerRadius={58} paddingAngle={3}>
                  {STATUS_DIST.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-2.5">
              {STATUS_DIST.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2" aria-label={`${entry.name}: ${entry.value}`}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} aria-hidden="true" />
                  <span className="text-[12px] text-muted-foreground">{entry.name}</span>
                  <span className="text-[12px] font-bold text-foreground ml-auto pl-4">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Outstanding payments */}
        <section aria-label="Outstanding Payments" className="rounded-xl border border-border bg-card overflow-hidden">
          <header className="px-4 py-3 border-b border-border bg-destructive/10/50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">Outstanding Payments</h3>
          </header>
          <div className="divide-y divide-border/50">
            {INVOICES.filter((i) => ["overdue", "pending", "partial"].includes(i.status)).map((inv) => {
              const balance = inv.finalAmt - (inv.paidAmt || 0);
              return (
                <article key={inv.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-foreground truncate m-0">{inv.studentName}</h4>
                    <p className="text-[11px] text-muted-foreground m-0">{inv.class}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-destructive m-0">{fmt(balance)}</p>
                    <p className={`text-[10px] font-semibold m-0 ${inv.status === "overdue" ? "text-destructive" : "text-warning"}`}>{inv.status}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Student payment history */}
      <StudentPaymentHistory />
    </div>
  );
}
