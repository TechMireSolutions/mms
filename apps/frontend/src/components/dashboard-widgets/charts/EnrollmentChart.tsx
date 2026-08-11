import React, { useMemo } from "react";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  Tooltip, TooltipContentProps
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { Badge } from "@/components/ui/badge";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetChartHeader } from "@/components/ui/WidgetChartHeader";
import { useEnrollmentsReportAggregates } from "@/tenant/hooks/collections/enrollments";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { formatMonthName, getRecentMonthsList } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORM_SELECT_MINI } from "@/components/ui/formStyles";

interface EnrollmentPoint {
  month: string;
  students: number;
}

/**
 * CustomTooltip for Enrollment Chart.
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  const { t } = useTranslation();
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      labelClassName="text-muted-foreground/80 mb-0.5 font-medium"
      value={t("dashboard.widgets.studentsCount", { count: Number(payload?.[0]?.value) })}
    />
  );
};

/**
 * Enrollment Chart — cumulative student growth from report-aggregates.
 */
export default function EnrollmentChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const { enrollment: COLOR_MAP } = useBrandedDashboardChartColors();
  const { data: reportAggregates } = useEnrollmentsReportAggregates();

  const {
    enrollmentChartType: chartType,
    enrollmentChartColor: colorTheme,
    enrollmentChartPeriod: monthsCount,
    updatePref,
  } = useDashboardConfig();

  const months = useMemo(() => getRecentMonthsList(12), []);
  const activeMonths = months.slice(-monthsCount);

  const enrollmentData: EnrollmentPoint[] = useMemo(() => {
    const byKey = new Map(
      (reportAggregates?.cumulativeTrends ?? []).map((trend) => [trend.monthKey, trend.students]),
    );
    return activeMonths.map((month) => ({
      month: month.label || formatMonthName(`${month.key}-01`),
      students: byKey.get(month.key) ?? 0,
    }));
  }, [activeMonths, reportAggregates?.cumulativeTrends]);

  const start = enrollmentData[0]?.students || 0;
  const end = enrollmentData[enrollmentData.length - 1]?.students || 0;
  const growth = start > 0 ? (((end - start) / start) * 100).toFixed(1) : "0";

  const activeColor = COLOR_MAP[colorTheme] || COLOR_MAP.brand;

  return (
    <WidgetCard ariaLabelledby="enrollment-chart-heading" accentColor="primary" className="p-5">
      <WidgetChartHeader
        headingId="enrollment-chart-heading"
        title={t("widget.title.enrollmentTrends")}
        subtitle={t("dashboard.charts.enrollment.subtitle")}
        actions={
          <>
            {isEditMode && (
              <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
                <Select
                  value={chartType}
                  onValueChange={(value) => {
                    updatePref("enrollmentChartType", value as "area" | "bar" | "line");
                  }}
                >
                  <SelectTrigger className={FORM_SELECT_MINI}>
                    <SelectValue placeholder={t("reports.visualizer.chartType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">{t("dashboard.charts.enrollment.area")}</SelectItem>
                    <SelectItem value="bar">{t("dashboard.charts.enrollment.bar")}</SelectItem>
                    <SelectItem value="line">{t("dashboard.charts.enrollment.line")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={colorTheme}
                  onValueChange={(value) => {
                    updatePref("enrollmentChartColor", value as "emerald" | "blue" | "violet" | "amber" | "red");
                  }}
                >
                  <SelectTrigger className={FORM_SELECT_MINI}>
                    <SelectValue placeholder={t("reports.visualizer.colorPalette")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerald">{t("dashboard.charts.attendance.emerald")}</SelectItem>
                    <SelectItem value="blue">{t("dashboard.charts.attendance.blue")}</SelectItem>
                    <SelectItem value="violet">{t("dashboard.charts.attendance.violet")}</SelectItem>
                    <SelectItem value="amber">{t("dashboard.charts.attendance.amber")}</SelectItem>
                    <SelectItem value="red">{t("dashboard.charts.attendance.red")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={String(monthsCount)}
                  onValueChange={(value) => {
                    updatePref("enrollmentChartPeriod", Number(value));
                  }}
                >
                  <SelectTrigger className={FORM_SELECT_MINI}>
                    <SelectValue placeholder={t("dashboard.widgets.selectPeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">{t("dashboard.charts.monthsRange", { count: 3 })}</SelectItem>
                    <SelectItem value="6">{t("dashboard.charts.monthsRange", { count: 6 })}</SelectItem>
                    <SelectItem value="10">{t("dashboard.charts.monthsRange", { count: 10 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge pill variant="outline" className={`gap-1.5 px-2.5 py-1 ${activeColor.bg} ${activeColor.text}`} aria-label={`Growth: ${growth}%`}>
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs font-bold tabular-nums">+{growth}%</span>
            </Badge>
          </>
        }
      />

      <SafeResponsiveContainer height={200}>
        <ComposedChart data={enrollmentData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            {Object.entries(COLOR_MAP).map(([key, config]) => (
              <linearGradient key={key} id={`enrollGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.stop} stopOpacity={0.18} />
                <stop offset="95%" stopColor={config.stop} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <ChartGrid vertical={false} />
          <XAxis dataKey="month" tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} />
          <YAxis tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 10"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: activeColor.stroke, strokeWidth: 1, strokeDasharray: "4 4" }} />

          {chartType === "area" && (
            <Area
              type="monotone"
              dataKey="students"
              stroke={activeColor.stroke}
              strokeWidth={2.5}
              fill={activeColor.fill}
              dot={false}
              activeDot={{ r: 5, fill: activeColor.stroke, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          )}
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="students"
              stroke={activeColor.stroke}
              strokeWidth={2.5}
              dot={{ r: 3, fill: activeColor.stroke }}
              activeDot={{ r: 5, fill: activeColor.stroke, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          )}
          {chartType === "bar" && (
            <Bar
              dataKey="students"
              fill={activeColor.stroke}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          )}
        </ComposedChart>
      </SafeResponsiveContainer>
    </WidgetCard>
  );
}
