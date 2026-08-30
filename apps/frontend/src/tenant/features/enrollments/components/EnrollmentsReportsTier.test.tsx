import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentsReportsTier } from "./EnrollmentsReportsTier";

vi.mock("@/components/ui/reports/KPISummary", () => ({
  default: ({ category }: { category: string }) => (
    <div data-testid="kpi-summary">KPI Summary: {category}</div>
  ),
}));

vi.mock("@/components/ui/reports/ModuleReports", () => ({
  default: ({ category }: { category: string }) => (
    <div data-testid="module-reports">Reports: {category}</div>
  ),
}));

describe("EnrollmentsReportsTier Component", () => {
  it("renders KPISummary and ModuleReports for enrollments", () => {
    const html = renderToStaticMarkup(<EnrollmentsReportsTier />);
    expect(html).toContain("KPI Summary: enrollments");
    expect(html).toContain("Reports: enrollments");
  });
});
