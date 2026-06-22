import React, { useState } from "react";
import { useBrandedDashboardChartColors } from "@/hooks/useBrandedDashboardChartColors";
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, TooltipContentProps, TooltipPayloadEntry,
} from "recharts";
import { revenueData as defaultRevenueData, RevenuePoint } from '@/lib/data/dashboardData';
import { getCollection } from "../../../lib/db";
import { INVOICES, Invoice } from '@/lib/data/financeData';

/**
 * CustomTooltip for Revenue Chart.
 * @param {TooltipContentProps<number, string>} props
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm space-y-1.5">
      <p className="text-muted-foreground text-[11px] font-medium m-0">{label}</p>
      {payload.map((p: TooltipPayloadEntry) => (
        <div key={p.dataKey as string | number} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          <span className="text-muted-foreground text-xs capitalize">{p.dataKey as string | number}</span>
          <span className="font-semibold text-foreground ml-auto">₨ {p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Revenue Chart component.
 * Displays financial revenue and expenses over a selected period.
 * @returns {React.ReactElement}
 */
export default function RevenueChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { revenue: COLOR_THEMES } = useBrandedDashboardChartColors();
  const [period, setPeriod] = useState<"6m" | "10m">("10m");
  const invoices = getCollection<Invoice>("finance_invoices", INVOICES);

  const [chartType, setChartType] = useState<"bar" | "line" | "area">(() => {
    return (localStorage.getItem("db_chart_type_revenue") as "bar" | "line" | "area") || "bar";
  });
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("db_chart_color_revenue") || "mixed";
  });

  const months = [
    { key: "2025-07", label: "Jul" },
    { key: "2025-08", label: "Aug" },
    { key: "2025-09", label: "Sep" },
    { key: "2025-10", label: "Oct" },
    { key: "2025-11", label: "Nov" },
    { key: "2025-12", label: "Dec" },
    { key: "2026-01", label: "Jan" },
    { key: "2026-02", label: "Feb" },
    { key: "2026-03", label: "Mar" },
    { key: "2026-04", label: "Apr" }
  ];

  const revenueData: RevenuePoint[] = months.map((m, idx) => {
    let revenue = 0;
    invoices.forEach(inv => {
      if (!inv || inv.status === "cancelled") return;
      const invMonth = (inv.paidDate || inv.dueDate || "").slice(0, 7);
      if (invMonth === m.key) {
        if (inv.status === "paid") {
          revenue += Number(inv.finalAmt || 0);
        } else if (inv.status === "partial") {
          revenue += Number(inv.paidAmt || 0);
        }
      }
    });

    const defaultPt = defaultRevenueData[idx];
    const isAuth = typeof window !== "undefined" && localStorage.getItem("mms_user") !== null;
    const scaleFactor = invoices.length > 0 ? (invoices.length / INVOICES.length) : 1;
    let expenses = defaultPt ? Math.round(defaultPt.expenses * scaleFactor) : Math.round(revenue * 0.6);

    if (isAuth) {
      expenses = invoices.length > 0 ? Math.round(revenue * 0.6) : 0;
    }

    if (revenue === 0 && defaultPt && !isAuth) {
      revenue = defaultPt.revenue;
      expenses = defaultPt.expenses;
    }

    return {
      month: m.label,
      revenue,
      expenses
    };
  });
  
  const data = period === "6m" ? revenueData.slice(-6) : revenueData;
  const activeColors = COLOR_THEMES[colorTheme] || COLOR_THEMES.mixed;

  return (
    <section aria-labelledby="revenue-chart-heading" className="bg-card rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 id="revenue-chart-heading" className="text-sm font-semibold text-foreground m-0">Revenue & Expenses</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">Monthly financial overview</p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(e) => {
                  const type = e.target.value as "bar" | "line" | "area";
                  setChartType(type);
                  localStorage.setItem("db_chart_type_revenue", type);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
              <select
                value={colorTheme}
                onChange={(e) => {
                  const col = e.target.value;
                  setColorTheme(col);
                  localStorage.setItem("db_chart_color_revenue", col);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="mixed">Mixed</option>
                <option value="emerald">Emerald</option>
                <option value="violet">Violet</option>
                <option value="blue">Blue</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </div>
          )}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {(["6m", "10m"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                  period === p ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4" aria-hidden="true">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.revenue }} />
          <span className="text-[11px] text-muted-foreground">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.expenses }} />
          <span className="text-[11px] text-muted-foreground">Expenses</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={activeColors.revenue} stopOpacity={0.2} />
              <stop offset="95%" stopColor={activeColors.revenue} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={activeColors.expenses} stopOpacity={0.15} />
              <stop offset="95%" stopColor={activeColors.expenses} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨ ${v / 1000}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
          
          {chartType === "area" && (
            <>
              <Area type="monotone" dataKey="revenue" stroke={activeColors.revenue} strokeWidth={2.5} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" stroke={activeColors.expenses} strokeWidth={2.5} fill="url(#expGrad)" />
            </>
          )}
          {chartType === "line" && (
            <>
              <Line type="monotone" dataKey="revenue" stroke={activeColors.revenue} strokeWidth={2.5} dot={{ r: 3, fill: activeColors.revenue }} />
              <Line type="monotone" dataKey="expenses" stroke={activeColors.expenses} strokeWidth={2.5} dot={{ r: 3, fill: activeColors.expenses }} />
            </>
          )}
          {chartType === "bar" && (
            <>
              <Bar dataKey="revenue" fill={activeColors.revenue} fillOpacity={activeColors.fillOpacityRevenue} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expenses" fill={activeColors.expenses} fillOpacity={activeColors.fillOpacityExpenses} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
