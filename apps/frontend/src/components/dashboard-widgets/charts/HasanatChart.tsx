import React, { useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
import {
  Cell, PieChart, Pie, Tooltip, TooltipContentProps,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/hooks/collections/hasanat";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { getDenominationPoints, formatNumber } from "@mms/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}

const HasanatTooltip = ({ active = false, payload = [] }: Partial<TooltipContentProps>) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-3.5 py-2.5 shadow-lg text-xs text-start">
      <p className="text-muted-foreground text-xs m-0">{payload[0].name}</p>
      <p className="font-bold text-foreground m-0">{t("hasanat.dashboard.pts", { count: formatNumber(payload[0].value) })}</p>

    </div>
  );
};


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
    <WidgetCard ariaLabelledby="hasanat-chart-heading" accentColor="warning" className="p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4 ps-1.5 select-none">
        <div>
          <h3 id="hasanat-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.hasanatDistribution")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.hasanat.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ms-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(value) => {
                  updatePref("hasanatChartType", value as "pie" | "bar" | "radar");
                }}
              >
                <SelectTrigger className="min-h-11 min-w-11 px-1.5 rounded text-xs font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder={t("reports.visualizer.chartType")} />
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
                <SelectTrigger className="min-h-11 min-w-11 px-1.5 rounded text-xs font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder={t("reports.visualizer.colorPalette")} />
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

      <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[7.5rem]">
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
          <div className="flex-shrink-0 w-full sm:w-[9.375rem] h-[7.5rem]" aria-hidden="true">
            <SafeResponsiveContainer height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={hasanatData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fontSize: 7 }} />
                <Radar name={t("dashboard.widgets.hasanatPointsSeries")} dataKey="value" stroke={activeColors.mem} fill={activeColors.mem} fillOpacity={0.35} />
                <Tooltip content={<HasanatTooltip />} />
              </RadarChart>
            </SafeResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 text-start">
          {hasanatData.map((hasanatPoint) => {
            const percentage = total > 0 ? ((hasanatPoint.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={hasanatPoint.name} aria-label={`${hasanatPoint.name}: ${percentage}%`}>
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2 select-none">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="w-2 h-2 shrink-0 rounded-full" style={{ background: hasanatPoint.color }} aria-hidden="true" />
                    <span className="min-w-0 truncate text-xs text-muted-foreground">{hasanatPoint.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{percentage}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: hasanatPoint.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}
