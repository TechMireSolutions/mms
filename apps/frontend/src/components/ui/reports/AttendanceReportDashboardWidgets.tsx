import { AttendanceChart } from "@/components/dashboard-widgets/charts/AttendanceChart";
import TodayAttendanceWidget from "@/components/dashboard-widgets/TodayAttendanceWidget";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useTranslation } from "@/hooks/useTranslation";

export function AttendanceReportDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("attendance.report.dashboardWidgetsTitle")}</h3>
        <SectionLabel as="p" weight="bold" tracking="wider" className="mt-0.5">{t("attendance.report.dashboardWidgetsSubtitle")}</SectionLabel>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceChart />
        <TodayAttendanceWidget />
      </div>
    </div>
  );
}
