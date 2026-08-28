import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceAnalytics } from "./AttendanceAnalytics";

vi.mock("./useAttendanceAnalyticsModel", () => ({
  useAttendanceAnalyticsModel: () => ({
    t: (key: string) => key,
    overallRate: 92,
    totalStats: { present: 100 },
    lowAttendance: [],
    studentRates: [{ name: "Ali", rate: 95 }],
    colors: ["#000"],
    classStats: [],
    monthlyTrend: [],
    pieData: [],
    statuses: [],
    topStudents: [],
  }),
}));

vi.mock("@/components/ui/ModuleCommandMetricsGrid", () => ({
  ModuleCommandMetricsGrid: ({ items }: { items: { label: string; value: any }[] }) => (
    <div data-testid="metrics-grid">{items.map((i) => `${i.label}:${i.value}`).join(", ")}</div>
  ),
}));

vi.mock("./AttendanceAnalyticsChartPanels", () => ({
  AttendanceAnalyticsChartPanels: () => <div data-testid="chart-panels">Chart Panels</div>,
}));

vi.mock("./AttendanceAnalyticsInsights", () => ({
  AttendanceAnalyticsInsights: () => <div data-testid="insights">Insights</div>,
}));

describe("AttendanceAnalytics Component", () => {
  it("renders metrics grid, chart panels, and insights", () => {
    const html = renderToStaticMarkup(
      <AttendanceAnalytics filters={{}} records={[]} />,
    );

    expect(html).toContain("attendance.analytics.kpi.overallAttendance:92%");
    expect(html).toContain("Chart Panels");
    expect(html).toContain("Insights");
  });
});
