import React, { useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  Tooltip, TooltipContentProps,
  ComposedChart, Area, Line, Bar, Cell, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { formatShortWeekdayLabels } from "@mms/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORM_SELECT_MINI } from "@/components/ui/formStyles";

interface AttendancePoint {
  day: string;
  rate: number;
}

const AttTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-3.5 py-2.5 shadow-lg text-xs text-start">
      <p className="text-muted-foreground text-xs m-0">{label}</p>
      <p className="font-bold text-foreground m-0">{payload[0].value}%</p>
    </div>
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

  const attendanceData: AttendancePoint[] = useMemo(() => {
    const uniqueDates = [...new Set(attendanceRecords.map((attendanceRecord) => attendanceRecord.date as string))].sort().reverse().slice(0, 7).reverse();
    const days = formatShortWeekdayLabels();
    return days.map((dayLabel, index) => {
      const targetDate = uniqueDates.find((attendanceDate) => {
        const dateObj = new Date(attendanceDate);
        const dayIndex = (dateObj.getDay() + 6) % 7; // Mon=0, Sun=6
        return dayIndex === index;
      });

      if (targetDate) {
        const dayRecords = attendanceRecords.filter((attendanceRecord) => attendanceRecord.date === targetDate);
        const total = dayRecords.length;
        const present = dayRecords.filter((attendanceRecord) => attendanceRecord.status === "present" || attendanceRecord.status === "late").length;
        return {
          day: dayLabel,
          rate: total > 0 ? Math.round((present / total) * 100) : 0
        };
      }

      return {
        day: dayLabel,
        rate: 0
      };
    });
  }, [attendanceRecords]);
  
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
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5 ps-1.5 select-none">
        <div>
          <h3 id="attendance-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.attendanceRate")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.attendance.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ms-auto">
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
        </div>
      </header>
      
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
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
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
