import React, { useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetChartHeader } from "@/components/ui/WidgetChartHeader";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  Tooltip, TooltipContentProps,
  ComposedChart, Area, Line, Bar, Cell, XAxis, YAxis,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import {
  buildWeeklyAttendancePoints,
  type AttendancePoint,
} from "@/components/dashboard-widgets/charts/attendanceChartData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORM_SELECT_MINI } from "@/components/ui/formStyles";

const AttTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      value={`${payload?.[0]?.value}%`}
    />
  );
};

/**
 * AttendanceChart component.
 * Displays weekly attendance rate with dynamic layouts.
 * @returns {React.ReactElement}
 */
export function AttendanceChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { attendance: ATTENDANCE_COLORS } = useBrandedDashboardChartColors();
  const palette = useBrandPalette();
  const attendanceRecords = useAttendanceRecordsCollection();

  const {
    attendanceChartType: chartType,
    attendanceChartColor: colorTheme,
    updatePref,
  } = useDashboardConfig();

  const attendanceData: AttendancePoint[] = useMemo(
    () => buildWeeklyAttendancePoints(attendanceRecords),
    [attendanceRecords],
  );
  
  const avg = useMemo(() => {
    return attendanceData.length ? Math.round(attendanceData.reduce((sum, attendancePoint) => sum + attendancePoint.rate, 0) / attendanceData.length) : 0;
  }, [attendanceData]);

  const isSemantic = colorTheme === "semantic";
  const themeColor = ATTENDANCE_COLORS[colorTheme] || ATTENDANCE_COLORS.brand;
  const semanticBarFill = (rate: number): string => {
    if (rate >= 90) return palette.primary;
    if (rate >= 80) return palette.secondary;
    return palette.charts[0];
  };

  return (
    <WidgetCard ariaLabelledby="attendance-chart-heading" accentColor="primary" className="p-5">
      <WidgetChartHeader
        headingId="attendance-chart-heading"
        title={t("widget.title.attendanceRate")}
        subtitle={t("dashboard.charts.attendance.subtitle")}
        actions={
          <>
            {isEditMode && (
              <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
                <Select
                  value={chartType}
                  onValueChange={(value) => {
                    updatePref("attendanceChartType", value as "bar" | "line" | "area");
                  }}
                >
                  <SelectTrigger className={FORM_SELECT_MINI}>
                    <SelectValue placeholder={t("reports.visualizer.chartType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">{t("dashboard.charts.attendance.barChart")}</SelectItem>
                    <SelectItem value="line">{t("dashboard.charts.attendance.lineChart")}</SelectItem>
                    <SelectItem value="area">{t("dashboard.charts.attendance.areaChart")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={colorTheme}
                  onValueChange={(value) => {
                    updatePref("attendanceChartColor", value);
                  }}
                >
                  <SelectTrigger className={FORM_SELECT_MINI}>
                    <SelectValue placeholder={t("reports.visualizer.colorPalette")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semantic">{t("dashboard.charts.attendance.semantic")}</SelectItem>
                    <SelectItem value="emerald">{t("dashboard.charts.attendance.emerald")}</SelectItem>
                    <SelectItem value="blue">{t("dashboard.charts.attendance.blue")}</SelectItem>
                    <SelectItem value="violet">{t("dashboard.charts.attendance.violet")}</SelectItem>
                    <SelectItem value="amber">{t("dashboard.charts.attendance.amber")}</SelectItem>
                    <SelectItem value="red">{t("dashboard.charts.attendance.red")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="text-end select-none">
              <p className="text-lg font-black text-foreground m-0 tabular-nums">{avg}%</p>
              <p className="text-xs text-muted-foreground mt-0.5 m-0 font-medium">{t("dashboard.charts.attendance.weeklyAvg")}</p>
            </div>
          </>
        }
      />
      
      <SafeResponsiveContainer height={170}>
        <ComposedChart
          data={attendanceData}
          margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
          onClick={() => {
            if (!isEditMode) {
              navigate(ROUTES.attendance);
            }
          }}
          className={isEditMode ? "cursor-default" : "cursor-pointer"}
        >
          <defs>
            <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={themeColor} stopOpacity={0.18} />
              <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <ChartGrid vertical={false} />
          <XAxis dataKey="day" tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={chartAxisTick(11, true)} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<AttTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
          
          {chartType === "area" && (
            <Area
              type="monotone"
              dataKey="rate"
              stroke={themeColor}
              strokeWidth={2.5}
              fill="url(#attGrad)"
              activeDot={{ r: 5, fill: themeColor, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          )}
          
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="rate"
              stroke={themeColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: themeColor }}
              activeDot={{ r: 5, fill: themeColor, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          )}

          {chartType === "bar" && (
            <Bar dataKey="rate" radius={[5, 5, 0, 0]} maxBarSize={32}>
              {attendanceData.map((attendancePoint, index) => (
                <Cell
                  key={index}
                  fill={isSemantic ? semanticBarFill(attendancePoint.rate) : themeColor}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          )}
        </ComposedChart>
      </SafeResponsiveContainer>
    </WidgetCard>
  );
}

export { HasanatChart } from "@/components/dashboard-widgets/charts/HasanatChart";
