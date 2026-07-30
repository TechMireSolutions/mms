import SessionsTable from "@/components/dashboard-widgets/SessionsTable";
import { useTranslation } from "@/hooks/useTranslation";

export function SessionReportDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-start">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("sessions.report.dashboardWidgetTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("sessions.report.dashboardWidgetSubtitle")}</p>
      </div>
      <SessionsTable />
    </div>
  );
}
