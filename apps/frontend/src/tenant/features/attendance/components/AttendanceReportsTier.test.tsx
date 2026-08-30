import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceReportsTier } from "./AttendanceReportsTier";

vi.mock("@/tenant/components/moduleReports", () => ({
  KPISummary: ({ category }: { category: string }) => <div data-testid="kpi-summary">KPI Summary: {category}</div>,
  ModuleReports: ({ category }: { category: string }) => <div data-testid="module-reports">Module Reports: {category}</div>,
}));

describe("AttendanceReportsTier Component", () => {
  it("renders KPI summary and module reports in canonical tier shell", () => {
    const html = renderToStaticMarkup(<AttendanceReportsTier />);

    expect(html).toContain("KPI Summary: attendance");
    expect(html).toContain("Module Reports: attendance");
  });
});

