import { AlertTriangle, TrendingDown, Award } from "lucide-react";
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { StatCard } from "@/components/ui/StatCard";
import { AttendanceAnalyticsChartPanels } from "@/tenant/features/attendance/components/AttendanceAnalyticsChartPanels";
import { AttendanceAnalyticsInsights } from "@/tenant/features/attendance/components/AttendanceAnalyticsInsights";
import { useAttendanceAnalyticsModel } from "@/tenant/features/attendance/components/useAttendanceAnalyticsModel";

interface AnalyticsFilters {
  classId?: string;
}

interface AttendanceAnalyticsProps {
  filters: AnalyticsFilters;
  records: AttendanceRecord[];
}

export function AttendanceAnalytics({ filters, records }: AttendanceAnalyticsProps) {
  const model = useAttendanceAnalyticsModel(filters, records);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={model.t("attendance.analytics.kpi.overallAttendance")} value={`${model.overallRate}%`} sub={model.t("attendance.analytics.kpi.allClasses")} icon={Award} accent="success" delayIndex={0} />
        <StatCard label={model.t("attendance.analytics.kpi.totalPresent")} value={model.totalStats.present} sub={model.t("attendance.analytics.kpi.allRecords")} icon={Award} accent="primary" delayIndex={1} />
        <StatCard label={model.t("attendance.analytics.kpi.lowAttendance")} value={model.lowAttendance.length} sub={model.t("attendance.analytics.kpi.belowThreshold")} icon={AlertTriangle} accent="warning" delayIndex={2} />
        <StatCard label={model.t("attendance.analytics.kpi.mostAbsent")} value={model.studentRates[0]?.name || "—"} sub={`${model.studentRates[0]?.rate || 0}%`} icon={TrendingDown} accent="destructive" delayIndex={3} />
      </div>

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
