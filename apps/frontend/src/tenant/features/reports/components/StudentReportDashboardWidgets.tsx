import EnrollmentChart from "@/components/dashboard-widgets/charts/EnrollmentChart";
import { useTranslation } from "@/hooks/useTranslation";

export function StudentReportDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("students.report.dashboardWidgetsTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("students.report.dashboardWidgetsSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnrollmentChart />
      </div>
    </div>
  );
}
