import React, { useState } from "react";
import { useBrandedDashboardChartColors } from "@/tenant/features/dashboard/hooks/useBrandedDashboardChartColors";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  Cell, PieChart, Pie, Tooltip, TooltipContentProps,
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { getCollection } from "@/lib/db";
import { AttendanceRecord } from '@/lib/data/attendanceData';
import { Distribution } from '@/lib/data/hasanatData';

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
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-sm">
      <p className="text-muted-foreground text-[11px] m-0">{label}</p>
      <p className="font-bold text-foreground m-0">{payload[0].value}%</p>
    </div>
  );
};

const HasanatTooltip = ({ active = false, payload = [] }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-sm">
      <p className="text-muted-foreground text-[11px] m-0">{payload[0].name}</p>
      <p className="font-bold text-foreground m-0">{payload[0].value?.toLocaleString()} pts</p>
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
  const { attendance: ATTENDANCE_COLORS } = useBrandedDashboardChartColors();
  const palette = useBrandPalette();
  const attendanceRecords = getCollection<AttendanceRecord>("attendance_records");

  const [chartType, setChartType] = useState<"bar" | "line" | "area">(() => {
    return (localStorage.getItem("db_chart_type_attendance") as "bar" | "line" | "area") || "bar";
  });
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("db_chart_color_attendance") || "semantic";
  });

  const uniqueDates = [...new Set(attendanceRecords.map((attendanceRecord) => attendanceRecord.date as string))].sort().reverse().slice(0, 7).reverse();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const attendanceData: AttendancePoint[] = days.map((dayLabel, index) => {
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
  
  const avg = attendanceData.length ? Math.round(attendanceData.reduce((sum, attendancePoint) => sum + attendancePoint.rate, 0) / attendanceData.length) : 0;

  const isSemantic = colorTheme === "semantic";
  const themeColor = ATTENDANCE_COLORS[colorTheme] || ATTENDANCE_COLORS.brand;
  const semanticBarFill = (rate: number): string => {
    if (rate >= 90) return palette.primary;
    if (rate >= 80) return palette.secondary;
    return palette.charts[0];
  };

  return (
    <section aria-labelledby="attendance-chart-heading" className="bg-card rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 id="attendance-chart-heading" className="text-sm font-semibold text-foreground m-0">
            {t("widget.title.attendanceRate")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">
            {t("dashboard.charts.attendance.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(event) => {
                  const selectedChartType = event.target.value as "bar" | "line" | "area";
                  setChartType(selectedChartType);
                  localStorage.setItem("db_chart_type_attendance", selectedChartType);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="bar">{t("dashboard.charts.attendance.barChart")}</option>
                <option value="line">{t("dashboard.charts.attendance.lineChart")}</option>
                <option value="area">{t("dashboard.charts.attendance.areaChart")}</option>
              </select>
              <select
                value={colorTheme}
                onChange={(event) => {
                  const selectedColorTheme = event.target.value;
                  setColorTheme(selectedColorTheme);
                  localStorage.setItem("db_chart_color_attendance", selectedColorTheme);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="semantic">{t("dashboard.charts.attendance.semantic")}</option>
                <option value="emerald">{t("dashboard.charts.attendance.emerald")}</option>
                <option value="blue">{t("dashboard.charts.attendance.blue")}</option>
                <option value="violet">{t("dashboard.charts.attendance.violet")}</option>
                <option value="amber">{t("dashboard.charts.attendance.amber")}</option>
                <option value="red">{t("dashboard.charts.attendance.red")}</option>
              </select>
            </div>
          )}
          <div className="text-right select-none">
            <p className="text-lg font-bold text-foreground m-0">{avg}%</p>
            <p className="text-[11px] text-muted-foreground m-0">{t("dashboard.charts.attendance.weeklyAvg")}</p>
          </div>
        </div>
      </header>
      
      <SafeResponsiveContainer height={170}>
        <ComposedChart data={attendanceData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
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
  const distributions = getCollection<Distribution>("hasanat_distributions");
  const denominations = getCollection<any>("hasanat_denoms");

  const [chartType, setChartType] = useState<"pie" | "bar" | "radar">(() => {
    return (localStorage.getItem("db_chart_type_hasanat") as "pie" | "bar" | "radar") || "pie";
  });
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("db_chart_color_hasanat") || "mixed";
  });

  let memorisationPoints = 0;
  let attendancePoints = 0;
  let behaviorPoints = 0;

  const pointsMap = new Map<string, number>();
  (denominations || []).forEach((denomination) => pointsMap.set(denomination.id, denomination.points));

  distributions.forEach((distribution) => {
    if (!distribution) return;
    const denominationName = String(distribution.denominationName || "").toLowerCase();
    const points = pointsMap.get(distribution.denominationId) || (
      denominationName.includes("silver") ? 150 :
      denominationName.includes("gold") ? 500 :
      denominationName.includes("platinum") ? 1000 :
      denominationName.includes("diamond") ? 2500 : 50
    );

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

  const hasanatData: HasanatPoint[] = [
    { name: t("dashboard.charts.hasanat.memorisation"), value: memorisationPoints, color: activeColors.mem },
    { name: t("dashboard.charts.hasanat.attendance"),   value: attendancePoints, color: activeColors.att },
    { name: t("dashboard.charts.hasanat.behavior"),     value: behaviorPoints, color: activeColors.beh }
  ];
  
  const total = hasanatData.reduce((sum, hasanatPoint) => sum + hasanatPoint.value, 0);

  return (
    <section aria-labelledby="hasanat-chart-heading" className="bg-card rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 id="hasanat-chart-heading" className="text-sm font-semibold text-foreground m-0">
            {t("widget.title.hasanatDistribution")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">
            {t("dashboard.charts.hasanat.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(event) => {
                  const selectedChartType = event.target.value as "pie" | "bar" | "radar";
                  setChartType(selectedChartType);
                  localStorage.setItem("db_chart_type_hasanat", selectedChartType);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="pie">{t("dashboard.charts.hasanat.pieDonut")}</option>
                <option value="bar">{t("dashboard.charts.hasanat.barChart")}</option>
                <option value="radar">{t("dashboard.charts.hasanat.radarChart")}</option>
              </select>
              <select
                value={colorTheme}
                onChange={(event) => {
                  const selectedColorTheme = event.target.value;
                  setColorTheme(selectedColorTheme);
                  localStorage.setItem("db_chart_color_hasanat", selectedColorTheme);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="mixed">{t("dashboard.charts.hasanat.mixed")}</option>
                <option value="emerald">{t("dashboard.charts.attendance.emerald")}</option>
                <option value="blue">{t("dashboard.charts.attendance.blue")}</option>
                <option value="violet">{t("dashboard.charts.attendance.violet")}</option>
              </select>
            </div>
          )}
          <p className="text-lg font-bold text-foreground m-0 select-none">{total.toLocaleString()}</p>
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
