import React, { useState } from "react";
import { useBrandedDashboardChartColors } from "@/hooks/useBrandedDashboardChartColors";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip, TooltipContentProps,
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
interface AttendancePoint {
  day: string;
  rate: number;
}

interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}
import { getCollection } from "../../../lib/db";
import { AttendanceRecord } from '@/lib/data/attendanceData';
import { Distribution } from '@/lib/data/hasanatData';

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
  const { attendance: ATTENDANCE_COLORS } = useBrandedDashboardChartColors();
  const palette = useBrandPalette();
  const records = getCollection<AttendanceRecord>("attendance_records");

  const [chartType, setChartType] = useState<"bar" | "line" | "area">(() => {
    return (localStorage.getItem("db_chart_type_attendance") as "bar" | "line" | "area") || "bar";
  });
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("db_chart_color_attendance") || "semantic";
  });

  const uniqueDates = [...new Set(records.map(r => r.date as string))].sort().reverse().slice(0, 7).reverse();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const attendanceData: AttendancePoint[] = days.map((dayLabel, index) => {
    const targetDate = uniqueDates.find(d => {
      const dateObj = new Date(d);
      const dayIndex = (dateObj.getDay() + 6) % 7; // Mon=0, Sun=6
      return dayIndex === index;
    });

    if (targetDate) {
      const dayRecords = records.filter(r => r.date === targetDate);
      const total = dayRecords.length;
      const present = dayRecords.filter(r => r.status === "present" || r.status === "late").length;
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
  
  const avg = attendanceData.length ? Math.round(attendanceData.reduce((s, d) => s + d.rate, 0) / attendanceData.length) : 0;

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
          <h3 id="attendance-chart-heading" className="text-sm font-semibold text-foreground m-0">Attendance Rate</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">This week by day</p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(e) => {
                  const type = e.target.value as "bar" | "line" | "area";
                  setChartType(type);
                  localStorage.setItem("db_chart_type_attendance", type);
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
                  localStorage.setItem("db_chart_color_attendance", col);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="semantic">Semantic</option>
                <option value="emerald">Emerald</option>
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </div>
          )}
          <div className="text-right select-none">
            <p className="text-lg font-bold text-foreground m-0">{avg}%</p>
            <p className="text-[11px] text-muted-foreground m-0">Weekly avg</p>
          </div>
        </div>
      </header>
      
      <ResponsiveContainer width="100%" height={170} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
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
              {attendanceData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={isSemantic ? semanticBarFill(entry.rate) : themeColor}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

/**
 * HasanatChart component.
 * Displays Hasanat points distribution using Pie/Bar/Radar charts.
 * @returns {React.ReactElement}
 */
export function HasanatChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { hasanat: HASANAT_THEMES } = useBrandedDashboardChartColors();
  const distributions = getCollection<Distribution>("hasanat_distributions");
  const denoms = getCollection<any>("hasanat_denoms");

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
  (denoms || []).forEach(d => pointsMap.set(d.id, d.points));

  distributions.forEach(d => {
    if (!d) return;
    const denom = String(d.denominationName || "").toLowerCase();
    const points = pointsMap.get(d.denominationId) || (
      denom.includes("silver") ? 150 :
      denom.includes("gold") ? 500 :
      denom.includes("platinum") ? 1000 :
      denom.includes("diamond") ? 2500 : 50
    );

    const totalPts = Number(d.quantity || 1) * points;

    const reason = String(d.reason || "").toLowerCase();
    if (reason.includes("attendance") || reason.includes("absence")) {
      attendancePoints += totalPts;
    } else if (reason.includes("juz") || reason.includes("hifz") || reason.includes("completion") || reason.includes("memorisation") || reason.includes("memorization") || reason.includes("milestone")) {
      memorisationPoints += totalPts;
    } else {
      behaviorPoints += totalPts;
    }
  });

  const activeColors = HASANAT_THEMES[colorTheme] || HASANAT_THEMES.mixed;

  const hasanatData: HasanatPoint[] = [
    { name: "Memorisation", value: memorisationPoints, color: activeColors.mem },
    { name: "Attendance",   value: attendancePoints, color: activeColors.att },
    { name: "Behavior",     value: behaviorPoints, color: activeColors.beh }
  ];
  
  const total = hasanatData.reduce((s, d) => s + d.value, 0);

  return (
    <section aria-labelledby="hasanat-chart-heading" className="bg-card rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 id="hasanat-chart-heading" className="text-sm font-semibold text-foreground m-0">Hasanat Distribution</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">Points by category this week</p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(e) => {
                  const type = e.target.value as "pie" | "bar" | "radar";
                  setChartType(type);
                  localStorage.setItem("db_chart_type_hasanat", type);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="pie">Pie Donut</option>
                <option value="bar">Bar Chart</option>
                <option value="radar">Radar Chart</option>
              </select>
              <select
                value={colorTheme}
                onChange={(e) => {
                  const col = e.target.value;
                  setColorTheme(col);
                  localStorage.setItem("db_chart_color_hasanat", col);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="mixed">Mixed</option>
                <option value="emerald">Emerald</option>
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
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
                {hasanatData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<HasanatTooltip />} />
            </PieChart>
          </div>
        )}

        {chartType === "bar" && (
          <div className="flex-1 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height={120} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={hasanatData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<HasanatTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {hasanatData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === "radar" && (
          <div className="flex-shrink-0 w-full sm:w-[150px] h-[120px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={hasanatData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: 7 }} />
                <Radar name="Points" dataKey="value" stroke={activeColors.mem} fill={activeColors.mem} fillOpacity={0.35} />
                <Tooltip content={<HasanatTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 text-left">
          {hasanatData.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={d.name} aria-label={`${d.name}: ${pct}%`}>
                <div className="flex items-center justify-between mb-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                    <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: d.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
