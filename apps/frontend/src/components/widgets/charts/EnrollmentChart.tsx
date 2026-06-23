import React, { useState } from "react";
import { useBrandedDashboardChartColors } from "@/hooks/useBrandedDashboardChartColors";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, TooltipContentProps
} from "recharts";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import type { Enrollment } from '@/lib/data/enrollmentData';
import { TrendingUp } from "lucide-react";

interface EnrollmentPoint {
  month: string;
  students: number;
}

/**
 * CustomTooltip for Enrollment Chart.
 * @param {TooltipProps<number, string>} props
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-sm">
      <p className="text-muted-foreground text-[11px] mb-0.5 m-0">{label}</p>
      <p className="font-bold text-foreground m-0">{payload[0].value} students</p>
    </div>
  );
};

/**
 * Enrollment Chart component.
 * Displays student growth over time with customisable layout settings.
 * @returns {React.ReactElement}
 */
export default function EnrollmentChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { enrollment: COLOR_MAP } = useBrandedDashboardChartColors();
  const enrollments = useLiveCollection<Enrollment>("enrollments");

  const [chartType, setChartType] = useState<"area" | "bar" | "line">(() => {
    return (localStorage.getItem("db_chart_type_enrollment") as "area" | "bar" | "line") || "area";
  });
  const [colorTheme, setColorTheme] = useState<"emerald" | "blue" | "violet" | "amber" | "red">(() => {
    return (localStorage.getItem("db_chart_color_enrollment") as "emerald" | "blue" | "violet" | "amber" | "red") || "emerald";
  });
  const [monthsCount, setMonthsCount] = useState<number>(() => {
    return Number(localStorage.getItem("db_chart_period_enrollment") || "10");
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

  const activeMonths = months.slice(-monthsCount);

  const enrollmentData: EnrollmentPoint[] = activeMonths.map((m) => {
    const count = enrollments.filter((e) => {
      if (!e?.enrolledDate) return false;
      return e.enrolledDate <= `${m.key}-31`;
    }).length;

    return {
      month: m.label,
      students: count
    };
  });
  
  const start = enrollmentData[0]?.students || 0;
  const end = enrollmentData[enrollmentData.length - 1]?.students || 0;
  const growth = start > 0 ? (((end - start) / start) * 100).toFixed(1) : "0";

  const activeColor = COLOR_MAP[colorTheme] || COLOR_MAP.brand;

  return (
    <section aria-labelledby="enrollment-chart-heading" className="bg-card rounded-xl border border-border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 id="enrollment-chart-heading" className="text-sm font-semibold text-foreground m-0">Enrollment Trends</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 m-0">Student growth over time</p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
              <select
                value={chartType}
                onChange={(e) => {
                  const type = e.target.value as "area" | "bar" | "line";
                  setChartType(type);
                  localStorage.setItem("db_chart_type_enrollment", type);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="area">Area</option>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
              <select
                value={colorTheme}
                onChange={(e) => {
                  const col = e.target.value as "emerald" | "blue" | "violet" | "amber" | "red";
                  setColorTheme(col);
                  localStorage.setItem("db_chart_color_enrollment", col);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value="emerald">Emerald</option>
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
              <select
                value={monthsCount}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  setMonthsCount(count);
                  localStorage.setItem("db_chart_period_enrollment", String(count));
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-card border-none text-foreground focus:outline-none cursor-pointer"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={10}>10 Months</option>
              </select>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${activeColor.bg} ${activeColor.text}`} aria-label={`Growth: ${growth}%`}>
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[12px] font-semibold">+{growth}%</span>
          </div>
        </div>
      </header>
      
      <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
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
      </ResponsiveContainer>
    </section>
  );
}
