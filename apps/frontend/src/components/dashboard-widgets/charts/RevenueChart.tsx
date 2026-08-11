import { useState } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { WidgetChartHeader } from "@/components/ui/WidgetChartHeader";
import { CompactSegmentedControl } from "@/components/ui/CompactSegmentedControl";
import { useBrandedDashboardChartColors } from "@/components/dashboard-widgets/useBrandedDashboardChartColors";
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
      <WidgetChartHeader
        headingId="revenue-chart-heading"
        title={t("widget.title.revenueExpenses")}
        subtitle={t("dashboard.charts.revenue.subtitle")}
        actions={
          <>
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
            <CompactSegmentedControl
              tone="card"
              className="bg-muted/65 rounded-lg p-0.5 border-border/50"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "6m", label: "6m" },
                { value: "10m", label: "10m" },
              ]}
            />
          </>
        }
      />

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
