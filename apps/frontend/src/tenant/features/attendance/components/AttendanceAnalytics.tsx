import { AlertTriangle, TrendingDown, Award } from "lucide-react";
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { AttendanceAnalyticsChartPanels } from "@/tenant/features/attendance/components/AttendanceAnalyticsChartPanels";
import { AttendanceAnalyticsInsights } from "@/tenant/features/attendance/components/AttendanceAnalyticsInsights";
import { useAttendanceAnalyticsModel } from "@/tenant/features/attendance/components/useAttendanceAnalyticsModel";

export interface AnalyticsFilters {
  classId?: string;
}

export interface AttendanceAnalyticsProps {
  filters: AnalyticsFilters;
  records: AttendanceRecord[];
}

export function AttendanceAnalytics({ filters, records }: AttendanceAnalyticsProps): React.JSX.Element {
  const model = useAttendanceAnalyticsModel(filters, records);

  return (
    <section className="space-y-6">
      <ModuleCommandMetricsGrid
        items={[
          {
            label: model.t("attendance.analytics.kpi.overallAttendance"),
            value: `${model.overallRate}%`,
            sub: model.t("attendance.analytics.kpi.allClasses"),
            icon: Award,
            accent: "success",
          },
          {
            label: model.t("attendance.analytics.kpi.totalPresent"),
            value: model.totalStats.present,
            sub: model.t("attendance.analytics.kpi.allRecords"),
            icon: Award,
            accent: "primary",
          },
          {
            label: model.t("attendance.analytics.kpi.lowAttendance"),
            value: model.lowAttendance.length,
            sub: model.t("attendance.analytics.kpi.belowThreshold"),
            icon: AlertTriangle,
            accent: "warning",
          },
          {
            label: model.t("attendance.analytics.kpi.mostAbsent"),
            value: model.studentRates[0]?.name || "—",
            sub: `${model.studentRates[0]?.rate || 0}%`,
            icon: TrendingDown,
            accent: "destructive",
          },
        ]}
      />

      <AttendanceAnalyticsChartPanels
        t={model.t}
        colors={model.colors}
        classStats={model.classStats}
        monthlyTrend={model.monthlyTrend}
        studentRates={model.studentRates}
        pieData={model.pieData}
        statuses={model.statuses}
        totalStats={model.totalStats}
      />

      <AttendanceAnalyticsInsights
        t={model.t}
        lowAttendance={model.lowAttendance}
        topStudents={model.topStudents}
      />
    </section>
  );
}
