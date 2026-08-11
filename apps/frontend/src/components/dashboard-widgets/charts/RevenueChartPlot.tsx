import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis,
  Tooltip,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { ROUTES } from "@/lib/config/routes";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { RevenueChartTooltip } from "@/components/dashboard-widgets/charts/RevenueChartTooltip";
import type { RevenuePoint } from "@/components/dashboard-widgets/charts/useRevenueChartData";

interface RevenueChartPlotProps {
  data: RevenuePoint[];
  chartType: "bar" | "line" | "area";
  activeColors: {
    revenue: string;
    expenses: string;
    fillOpacityRevenue?: number;
    fillOpacityExpenses?: number;
  };
  isEditMode: boolean;
}

export function RevenueChartPlot({
  data,
  chartType,
  activeColors,
  isEditMode,
}: RevenueChartPlotProps) {
  const navigate = useNavigate();
  const { formatCurrency } = useFinanceCurrency();

  const formatYAxisTick = useCallback((value: number) => {
    if (value === 0) return formatCurrency(0);
    return `${formatCurrency(Math.round(value / 1000))}k`;
  }, [formatCurrency]);

  return (
    <SafeResponsiveContainer height={200}>
      <ComposedChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
        onClick={() => {
          if (!isEditMode) {
            navigate(ROUTES.accounting);
          }
        }}
        className={isEditMode ? "cursor-default" : "cursor-pointer"}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={activeColors.revenue} stopOpacity={0.2} />
            <stop offset="95%" stopColor={activeColors.revenue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={activeColors.expenses} stopOpacity={0.15} />
            <stop offset="95%" stopColor={activeColors.expenses} stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartGrid vertical={false} />
        <XAxis dataKey="month" tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} />
        <YAxis tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} tickFormatter={formatYAxisTick} />
        <Tooltip content={<RevenueChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />

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
    </SafeResponsiveContainer>
  );
}
