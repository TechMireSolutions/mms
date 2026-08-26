import type React from "react";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { AttendanceAnalytics } from "@/tenant/features/attendance/components/AttendanceAnalytics";
import ModuleReports from "@/components/ui/reports/ModuleReports";
import KPISummary from "@/components/ui/reports/KPISummary";
import type { AttendanceRecord } from "@/lib/data/attendanceData";

type AttendanceReportTab = {
  id: string;
  label: string;
};

interface AttendanceReportsTierProps {
  role: string;
  filters: React.ComponentProps<typeof AttendanceAnalytics>["filters"];
  records: AttendanceRecord[];
  analyticsTabs: AttendanceReportTab[];
  activeAnalyticsTab: string;
  onAnalyticsTabChange: (next: string) => void;
}

export function AttendanceReportsTier({
  role,
  filters,
  records,
  analyticsTabs,
  activeAnalyticsTab,
  onAnalyticsTabChange,
}: AttendanceReportsTierProps): React.JSX.Element {
  return (
    <div className="space-y-5">
      <KPISummary category="attendance" role={role} />
      <SubTabBar
        tabs={analyticsTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
        value={activeAnalyticsTab}
        onChange={onAnalyticsTabChange}
      />

      {activeAnalyticsTab === "charts" ? (
        <AttendanceAnalytics filters={filters} records={records} />
      ) : (
        <ModuleReports category="attendance" />
      )}
    </div>
  );
}
