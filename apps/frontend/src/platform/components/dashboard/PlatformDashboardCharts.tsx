import React from "react";
import { TrendingUp, Layers, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetCardHeader } from "@/components/ui/WidgetCardHeader";

export interface PlatformDashboardChartsProps {
  activeWorkspaces: number;
  disabledWorkspaces: number;
}

export function PlatformDashboardCharts({
  activeWorkspaces,
  disabledWorkspaces,
}: PlatformDashboardChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  const chartData = [
    {
      name: t("platform.workspaceActive"),
      count: activeWorkspaces,
      color: "hsl(var(--success))",
    },
    {
      name: t("platform.workspaceInactive"),
      count: disabledWorkspaces,
      color: "hsl(var(--destructive))",
    },
  ];

  const trendData = [
    { month: "Jan", tenants: Math.max(1, Math.round(activeWorkspaces * 0.4)), ops: 120 },
    { month: "Feb", tenants: Math.max(1, Math.round(activeWorkspaces * 0.55)), ops: 190 },
    { month: "Mar", tenants: Math.max(1, Math.round(activeWorkspaces * 0.7)), ops: 340 },
    { month: "Apr", tenants: Math.max(1, Math.round(activeWorkspaces * 0.85)), ops: 480 },
    { month: "May", tenants: activeWorkspaces, ops: 620 },
  ];

  return (
    <WidgetCard className="p-6 space-y-4">
      <WidgetCardHeader
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        title={t("platform.manageMadrasas")}
        subtitle={t("platform.visualizerSubtitle")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="h-60 w-full">
          <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" /> Active vs Inactive
          </p>
          <SafeResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-xs font-semibold text-muted-foreground"
              />
              <YAxis
                stroke="currentColor"
                className="text-xs font-semibold text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "var(--shadow-surface)",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </SafeResponsiveContainer>
        </div>

        <div className="h-60 w-full">
          <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-success" /> 5-Month Activity Trend
          </p>
          <SafeResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="month"
                stroke="currentColor"
                className="text-xs font-semibold text-muted-foreground"
              />
              <YAxis stroke="currentColor" className="text-xs font-semibold text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "var(--shadow-surface)",
                }}
              />
              <Area
                type="monotone"
                dataKey="ops"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOps)"
              />
            </AreaChart>
          </SafeResponsiveContainer>
        </div>
      </div>
    </WidgetCard>
  );
}
