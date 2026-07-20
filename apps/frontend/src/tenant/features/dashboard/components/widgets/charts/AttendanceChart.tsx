import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { useBrandedDashboardChartColors } from "@/tenant/features/dashboard/hooks/useBrandedDashboardChartColors";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  Cell, PieChart, Pie, Tooltip, TooltipContentProps,
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { useAttendanceRecordsCollection } from "@/tenant/features/attendance/hooks/useAttendance";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { useDashboardConfig } from "@/tenant/features/dashboard/hooks/useDashboardConfig";
import { getDenominationPoints } from "@mms/shared";
import { formatNumber } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendancePoint {
  day: string;
  rate: number;
}

interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}

const AttTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-3.5 py-2.5 shadow-lg text-xs text-left">
      <p className="text-muted-foreground text-[10px] m-0">{label}</p>
      <p className="font-bold text-foreground m-0">{payload[0].value}%</p>
    </div>
  );
};

const HasanatTooltip = ({ active = false, payload = [] }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-3.5 py-2.5 shadow-lg text-xs text-left">
      <p className="text-muted-foreground text-[10px] m-0">{payload[0].name}</p>
      <p className="font-bold text-foreground m-0">{formatNumber(payload[0].value)} pts</p>

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
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
    <section aria-labelledby="attendance-chart-heading" className="relative overflow-hidden group rounded-2xl surface-glass p-5 shadow-sm hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left">
      <div className="absolute start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] bg-primary/60 group-hover:bg-primary transition-colors duration-300" />
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5 pl-1.5 select-none">
        <div>
          <h3 id="attendance-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.attendanceRate")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.attendance.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(value) => {
                  updatePref("attendanceChartType", value as "bar" | "line" | "area");
                }}
              >
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select chart type" />
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
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select color theme" />
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
          <div className="text-right select-none">
            <p className="text-lg font-black text-foreground m-0 tabular-nums">{avg}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 m-0 font-medium">{t("dashboard.charts.attendance.weeklyAvg")}</p>
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
              activeDot={{ r: 5, fill: themeColor, strokeWidth: 2, stroke: "#fff" }}
            />
          )}
          
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="rate"
              stroke={themeColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: themeColor }}
              activeDot={{ r: 5, fill: themeColor, strokeWidth: 2, stroke: "#fff" }}
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
    </section>
  );
}

/**
 * HasanatChart component.
 * Displays Hasanat points distribution using Pie/Bar/Radar charts.
 * @returns {React.ReactElement}
 */
export function HasanatChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const { hasanat: HASANAT_THEMES } = useBrandedDashboardChartColors();
  const distributions = useHasanatDistributionsCollection();
  const denominations = useHasanatDenomsCollection();

  const {
    hasanatChartType: chartType,
    hasanatChartColor: colorTheme,
    updatePref,
  } = useDashboardConfig();

  const { hasanatData, total, activeColors } = useMemo(() => {
    let memorisationPoints = 0;
    let attendancePoints = 0;
    let behaviorPoints = 0;

    distributions.forEach((distribution) => {
      if (!distribution) return;
      const points = getDenominationPoints(distribution.denominationId, distribution.denominationName, denominations);

      const totalPoints = Number(distribution.quantity || 1) * points;

      const reason = String(distribution.reason || "").toLowerCase();
      if (reason.includes("attendance") || reason.includes("absence")) {
        attendancePoints += totalPoints;
      } else if (reason.includes("juz") || reason.includes("hifz") || reason.includes("completion") || reason.includes("memorisation") || reason.includes("memorization") || reason.includes("milestone")) {
        memorisationPoints += totalPoints;
      } else {
        behaviorPoints += totalPoints;
      }
    });

    const activeColors = HASANAT_THEMES[colorTheme] || HASANAT_THEMES.mixed;

    const data: HasanatPoint[] = [
      { name: t("dashboard.charts.hasanat.memorisation"), value: memorisationPoints, color: activeColors.mem },
      { name: t("dashboard.charts.hasanat.attendance"),   value: attendancePoints, color: activeColors.att },
      { name: t("dashboard.charts.hasanat.behavior"),     value: behaviorPoints, color: activeColors.beh }
    ];
    
    const sum = data.reduce((s, hasanatPoint) => s + hasanatPoint.value, 0);
    return { hasanatData: data, total: sum, activeColors };
  }, [distributions, denominations, colorTheme, HASANAT_THEMES, t]);

  return (
    <section aria-labelledby="hasanat-chart-heading" className="relative overflow-hidden group rounded-2xl surface-glass p-5 shadow-sm hover:-translate-y-1 hover:shadow-surface-lg transition-all duration-300 text-left">
      <div className="absolute start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] bg-warning/60 group-hover:bg-warning transition-colors duration-300" />
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4 pl-1.5 select-none">
        <div>
          <h3 id="hasanat-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.hasanatDistribution")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.hasanat.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(value) => {
                  updatePref("hasanatChartType", value as "pie" | "bar" | "radar");
                }}
              >
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pie">{t("dashboard.charts.hasanat.pieDonut")}</SelectItem>
                  <SelectItem value="bar">{t("dashboard.charts.hasanat.barChart")}</SelectItem>
                  <SelectItem value="radar">{t("dashboard.charts.hasanat.radarChart")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={colorTheme}
                onValueChange={(value) => {
                  updatePref("hasanatChartColor", value);
                }}
              >
                <SelectTrigger className="h-6 px-1.5 py-0.5 rounded text-[10px] font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder="Select color theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{t("dashboard.charts.hasanat.mixed")}</SelectItem>
                  <SelectItem value="emerald">{t("dashboard.charts.attendance.emerald")}</SelectItem>
                  <SelectItem value="blue">{t("dashboard.charts.attendance.blue")}</SelectItem>
                  <SelectItem value="violet">{t("dashboard.charts.attendance.violet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-lg font-black text-foreground m-0 select-none tabular-nums">{formatNumber(total)}</p>

        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[120px]">
        {/* Chart Drawing Container */}
        {chartType === "pie" && (
          <div className="flex-shrink-0" aria-hidden="true">
            <PieChart width={120} height={120}>
              <Pie
                data={hasanatData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
              >
                {hasanatData.map((hasanatPoint, index) => (
                  <Cell key={index} fill={hasanatPoint.color} />
                ))}
              </Pie>
              <Tooltip content={<HasanatTooltip />} />
            </PieChart>
          </div>
        )}

        {chartType === "bar" && (
          <div className="flex-1 w-full" aria-hidden="true">
            <SafeResponsiveContainer height={120}>
              <BarChart data={hasanatData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<HasanatTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {hasanatData.map((hasanatPoint, index) => (
                    <Cell key={index} fill={hasanatPoint.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        )}

        {chartType === "radar" && (
          <div className="flex-shrink-0 w-full sm:w-[150px] h-[120px]" aria-hidden="true">
            <SafeResponsiveContainer height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={hasanatData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: 7 }} />
                <Radar name="Points" dataKey="value" stroke={activeColors.mem} fill={activeColors.mem} fillOpacity={0.35} />
                <Tooltip content={<HasanatTooltip />} />
              </RadarChart>
            </SafeResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 text-left">
          {hasanatData.map((hasanatPoint) => {
            const percentage = total > 0 ? ((hasanatPoint.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={hasanatPoint.name} aria-label={`${hasanatPoint.name}: ${percentage}%`}>
                <div className="flex items-center justify-between mb-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: hasanatPoint.color }} aria-hidden="true" />
                    <span className="text-[11px] text-muted-foreground">{hasanatPoint.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">{percentage}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: hasanatPoint.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
