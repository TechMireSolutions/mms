import React, { useState } from "react";
import { useBrandedDashboardChartColors } from "@/tenant/features/dashboard/hooks/useBrandedDashboardChartColors";
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, TooltipContentProps, TooltipPayloadEntry,
} from "recharts";
import { getCollection } from "@/lib/db";
import type { Invoice } from '@/lib/data/financeData';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

/**
 * CustomTooltip for Revenue Chart.
 * @param {TooltipContentProps<number, string>} props
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm space-y-1.5">
      <p className="text-muted-foreground text-[11px] font-medium m-0">{label}</p>
      {payload.map((payloadEntry: TooltipPayloadEntry) => (
        <div key={payloadEntry.dataKey as string | number} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: payloadEntry.color }} aria-hidden="true" />
          <span className="text-muted-foreground text-xs capitalize">{payloadEntry.dataKey as string | number}</span>
          <span className="font-semibold text-foreground ml-auto">₨ {payloadEntry.value?.toLocaleString()}</span>
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
  const invoices = getCollection<Invoice>("finance_invoices");

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

  const revenueData: RevenuePoint[] = months.map((monthDefinition) => {
    let revenue = 0;
    invoices.forEach((invoice) => {
      if (!invoice || invoice.status === "cancelled") return;
      const invoiceMonth = (invoice.paidDate || invoice.dueDate || "").slice(0, 7);
      if (invoiceMonth === monthDefinition.key) {
        if (invoice.status === "paid") {
          revenue += Number(invoice.finalAmt || 0);
        } else if (invoice.status === "partial") {
          revenue += Number(invoice.paidAmt || 0);
        }
      }
    });

    const expenses = invoices.length > 0 ? Math.round(revenue * 0.6) : 0;

    return {
      month: monthDefinition.label,
      revenue,
      expenses
    };
  });
  
  const visibleRevenueData = period === "6m" ? revenueData.slice(-6) : revenueData;
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
              <Select
                value={chartType}
                onValueChange={(chartTypeValue) => {
                  const selectedChartType = chartTypeValue as "bar" | "line" | "area";
                  setChartType(selectedChartType);
                  localStorage.setItem("db_chart_type_revenue", selectedChartType);
                }}
              >
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={colorTheme}
                onValueChange={(selectedColorTheme) => {
                  setColorTheme(selectedColorTheme);
                  localStorage.setItem("db_chart_color_revenue", selectedColorTheme);
                }}
              >
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select color theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {(["6m", "10m"] as const).map((periodOption) => (
              <Button
                key={periodOption}
                variant="ghost"
                onClick={() => setPeriod(periodOption)}
                aria-pressed={period === periodOption}
                className={`text-[11px] font-medium px-2.5 py-1 h-auto rounded-md transition-all shadow-none ${
                  period === periodOption ? "bg-card text-foreground hover:bg-card hover:text-foreground" : "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                }`}
              >
                {periodOption}
              </Button>
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
        <ComposedChart data={visibleRevenueData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
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
