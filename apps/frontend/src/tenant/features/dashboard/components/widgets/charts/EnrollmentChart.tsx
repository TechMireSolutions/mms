import React, { useMemo } from "react";
import { useBrandedDashboardChartColors } from "@/tenant/features/dashboard/hooks/useBrandedDashboardChartColors";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, TooltipContentProps
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardConfig } from "@/tenant/features/dashboard/hooks/useDashboardConfig";
import { getRecentMonthsList } from "@/lib/utils";
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
 * @param {TooltipProps<number, string>} props
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-3.5 py-2.5 shadow-lg text-xs text-left">
      <p className="text-muted-foreground/80 text-[10px] mb-0.5 m-0 font-medium select-none">{label}</p>
      <p className="font-bold text-foreground m-0 tabular-nums">
        {t("dashboard.widgets.studentsCount", { count: Number(payload[0].value) })}
      </p>
    </div>
  );
};

/**
 * Enrollment Chart component.
 * Displays student growth over time with customisable layout settings.
 * @returns {React.ReactElement}
 */
export default function EnrollmentChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const { enrollment: COLOR_MAP } = useBrandedDashboardChartColors();
  const enrollments = useEnrollmentsCollection();

  const {
    enrollmentChartType: chartType,
    enrollmentChartColor: colorTheme,
    enrollmentChartPeriod: monthsCount,
    updatePref,
  } = useDashboardConfig();

  const months = useMemo(() => getRecentMonthsList(12), []);

  const activeMonths = months.slice(-monthsCount);

  const enrollmentData: EnrollmentPoint[] = activeMonths.map((month) => {
    const count = enrollments.filter((enrollment) => {
      if (!enrollment?.enrolledDate) return false;
      return enrollment.enrolledDate <= `${month.key}-31`;
    }).length;

    return {
      month: month.label,
      students: count
    };
  });
  
  const start = enrollmentData[0]?.students || 0;
  const end = enrollmentData[enrollmentData.length - 1]?.students || 0;
  const growth = start > 0 ? (((end - start) / start) * 100).toFixed(1) : "0";

  const activeColor = COLOR_MAP[colorTheme] || COLOR_MAP.brand;

  return (
    <section aria-labelledby="enrollment-chart-heading" className="relative overflow-hidden group rounded-2xl surface-glass p-5 shadow-sm hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left">
      <div className="absolute start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5 pl-1.5 select-none">
        <div>
          <h3 id="enrollment-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.enrollmentTrends")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.enrollment.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ms-auto">

          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(value) => {
                  updatePref("enrollmentChartType", value as "area" | "bar" | "line");
                }}
              >
                <SelectTrigger className={FORM_SELECT_MINI}>
                  <SelectValue placeholder="Select chart type" />
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
                  <SelectValue placeholder="Select color theme" />
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
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t("dashboard.charts.monthsRange", { count: 3 })}</SelectItem>
                  <SelectItem value="6">{t("dashboard.charts.monthsRange", { count: 6 })}</SelectItem>
                  <SelectItem value="10">{t("dashboard.charts.monthsRange", { count: 10 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${activeColor.bg} ${activeColor.text}`} aria-label={`Growth: ${growth}%`}>
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[11px] font-bold tabular-nums">+{growth}%</span>
          </div>
        </div>
      </header>
      
      <SafeResponsiveContainer height={200}>
        <ComposedChart data={enrollmentData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            {Object.entries(COLOR_MAP).map(([key, config]) => (
              <linearGradient key={key} id={`enrollGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={config.stop} stopOpacity={0.18} />
                <stop offset="95%" stopColor={config.stop} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 10"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: activeColor.stroke, strokeWidth: 1, strokeDasharray: "4 4" }} />
          
          {chartType === "area" && (
            <Area
              type="monotone"
              dataKey="students"
              stroke={activeColor.stroke}
              strokeWidth={2.5}
              fill={activeColor.fill}
              dot={false}
              activeDot={{ r: 5, fill: activeColor.stroke, strokeWidth: 2, stroke: "#fff" }}
            />
          )}
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="students"
              stroke={activeColor.stroke}
              strokeWidth={2.5}
              dot={{ r: 3, fill: activeColor.stroke }}
              activeDot={{ r: 5, fill: activeColor.stroke, strokeWidth: 2, stroke: "#fff" }}
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
    </section>
  );
}
