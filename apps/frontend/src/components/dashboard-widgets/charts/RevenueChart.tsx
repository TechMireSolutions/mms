import { useState } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORM_SELECT_MINI } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { useRevenueChartData } from "@/components/dashboard-widgets/charts/useRevenueChartData";
import { RevenueChartPlot } from "@/components/dashboard-widgets/charts/RevenueChartPlot";

export default function RevenueChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const { revenue: COLOR_THEMES } = useBrandedDashboardChartColors();
  const [period, setPeriod] = useState<"6m" | "10m">("10m");
  const { revenueData } = useRevenueChartData();

  const {
    revenueChartType: chartType,
    revenueChartColor: colorTheme,
    updatePref,
  } = useDashboardConfig();

  const visibleRevenueData = period === "6m" ? revenueData.slice(-6) : revenueData;
  const activeColors = COLOR_THEMES[colorTheme] || COLOR_THEMES.mixed;

  return (
    <WidgetCard ariaLabelledby="revenue-chart-heading" accentColor="primary" className="p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5 ps-1.5 select-none">
        <div>
          <h3 id="revenue-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.revenueExpenses")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.revenue.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 ms-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(chartTypeValue) => {
                  updatePref("revenueChartType", chartTypeValue as "bar" | "line" | "area");
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
                onValueChange={(selectedColorTheme) => {
                  updatePref("revenueChartColor", selectedColorTheme);
                }}
              >
                <SelectTrigger className={FORM_SELECT_MINI}>
                  <SelectValue placeholder={t("reports.visualizer.colorPalette")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{t("dashboard.charts.hasanat.mixed")}</SelectItem>
                  <SelectItem value="emerald">{t("dashboard.charts.attendance.emerald")}</SelectItem>
                  <SelectItem value="violet">{t("dashboard.charts.attendance.violet")}</SelectItem>
                  <SelectItem value="blue">{t("dashboard.charts.attendance.blue")}</SelectItem>
                  <SelectItem value="amber">{t("dashboard.charts.attendance.amber")}</SelectItem>
                  <SelectItem value="red">{t("dashboard.charts.attendance.red")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-1 bg-muted/65 rounded-lg p-0.5 border border-border/50">
            {(["6m", "10m"] as const).map((periodOption) => (
              <Button
                key={periodOption}
                variant="ghost"
                onClick={() => setPeriod(periodOption)}
                aria-pressed={period === periodOption}
                className={`min-h-11 text-xs font-bold uppercase tracking-wider px-2.5 rounded-md transition-all shadow-none cursor-pointer ${
                  period === periodOption ? "bg-card text-foreground hover:bg-card hover:text-foreground" : "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                }`}
              >
                {periodOption}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4 mb-4" aria-hidden="true">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.revenue }} />
          <span className="text-xs text-muted-foreground">
            {t("accounting.dashboard.revenue")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.expenses }} />
          <span className="text-xs text-muted-foreground">
            {t("accounting.dashboard.expenses")}
          </span>
        </div>
      </div>

      <RevenueChartPlot
        data={visibleRevenueData}
        chartType={chartType}
        activeColors={activeColors}
        isEditMode={isEditMode}
      />
    </WidgetCard>
  );
}
