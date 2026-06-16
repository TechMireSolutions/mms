import React from "react";
import { useBrandPalette } from "@/lib/BrandingPaletteContext";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { INVOICES, MONTHLY_REVENUE } from "../../lib/financeData";
import { useLiveCollection } from "../../hooks/useLiveCollection";

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

/**
 * FinanceSummary Component
 * 
 * Displays key financial metrics (Total Collected, Outstanding, Overdue, Collection Rate)
 * with inline sparkline charts.
 * 
 * @returns {React.ReactElement}
 */
export default function FinanceSummary() {
  const { primary, secondary, charts } = useBrandPalette();
  const invoices = useLiveCollection("finance_invoices", INVOICES);

  const totalCollected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.finalAmt, 0);
  const totalOutstanding = invoices.filter((i) => ["pending", "overdue", "partial"].includes(i.status)).reduce((s, i) => s + (i.finalAmt - (i.paidAmt || 0)), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.finalAmt, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const totalInvoices = invoices.length;
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;

  const cards = [
    {
      label: "Total Collected",
      value: fmt(totalCollected),
      sub: `${paidCount} invoices paid`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      chart: MONTHLY_REVENUE.map((m) => ({ v: m.collected })),
      chartColor: primary,
    },
    {
      label: "Outstanding",
      value: fmt(totalOutstanding),
      sub: `${invoices.filter((i) => ["pending", "partial"].includes(i.status)).length} pending`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      chart: MONTHLY_REVENUE.map((m) => ({ v: m.outstanding })),
      chartColor: secondary,
    },
    {
      label: "Overdue",
      value: fmt(totalOverdue),
      sub: `${invoices.filter((i) => i.status === "overdue").length} invoices overdue`,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      chart: MONTHLY_REVENUE.map((m) => ({ v: Math.round(m.outstanding * 0.6) })),
      chartColor: "#ef4444",
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      sub: `${totalInvoices} total invoices`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/10",
      chart: MONTHLY_REVENUE.map((m, i) => ({ v: 70 + i * 3 })),
      chartColor: charts[2],
    },
  ];

  return (
    <section aria-label="Finance Summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-xl border ${card.border} bg-card p-4 overflow-hidden relative`}
          >
            <header className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide m-0">{card.label}</h3>
                <p className={`text-[18px] font-bold ${card.color} mt-0.5 m-0`}>{card.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{card.sub}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </header>
            <div className="h-12 -mx-4 -mb-4" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <AreaChart data={card.chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Area type="monotone" dataKey="v" stroke={card.chartColor} strokeWidth={1.5} fill={card.chartColor} fillOpacity={0.08} />
                  <Tooltip content={() => null} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}
