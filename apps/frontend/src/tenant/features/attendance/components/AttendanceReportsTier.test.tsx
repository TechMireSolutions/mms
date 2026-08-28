import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceReportsTier } from "./AttendanceReportsTier";

vi.mock("@/components/ui/reports/KPISummary", () => ({
  default: () => <div data-testid="kpi-summary">KPI Summary</div>,
}));

vi.mock("@/tenant/features/attendance/components/AttendanceAnalytics", () => ({
  AttendanceAnalytics: () => <div data-testid="analytics">Attendance Analytics</div>,
}));

vi.mock("@/components/ui/reports/ModuleReports", () => ({
  default: () => <div data-testid="module-reports">Module Reports</div>,
}));

vi.mock("@/components/ui/SubTabBar", () => ({
  SubTabBar: ({ tabs }: { tabs: { label: string }[] }) => (
    <div data-testid="sub-tab-bar">{tabs.map((t) => t.label).join(", ")}</div>
  ),
}));

describe("AttendanceReportsTier Component", () => {
  it("renders KPI summary and analytics charts when active", () => {
    const html = renderToStaticMarkup(
      <AttendanceReportsTier
        role="admin"
        filters={{ date: "2025-01-01", session: "all", classId: "all" } as any}
        records={[]}
        analyticsTabs={[
          { id: "charts", label: "Charts" },
          { id: "reports", label: "Reports" },
        ]}
        activeAnalyticsTab="charts"
        onAnalyticsTabChange={vi.fn()}
      />,
    );

    expect(html).toContain("KPI Summary");
    expect(html).toContain("Attendance Analytics");
  });
});
