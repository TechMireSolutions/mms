import React from "react";
import { HasanatChart } from "@/components/dashboard-widgets/charts/AttendanceChart";
import { useTranslation } from "@/hooks/useTranslation";

export function HasanatDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-start">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("hasanat.report.dashboardWidgetTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">
          {t("hasanat.report.dashboardWidgetSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HasanatChart />
      </div>
    </div>
  );
}
