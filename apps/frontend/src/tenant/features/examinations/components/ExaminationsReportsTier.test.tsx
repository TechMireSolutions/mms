import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationsReportsTier } from "./ExaminationsReportsTier";

vi.mock("@/components/ui/reports/KPISummary", () => ({
  default: ({ category }: { category: string }) => <div data-testid="kpi-summary">{category}</div>,
}));

vi.mock("@/components/ui/reports/ModuleReports", () => ({
  default: ({ category }: { category: string }) => <div data-testid="module-reports">{category}</div>,
}));

describe("ExaminationsReportsTier Component", () => {
  it("renders KPI summary and module reports for examinations", () => {
    const html = renderToStaticMarkup(<ExaminationsReportsTier />);
    expect(html).toContain("kpi-summary");
    expect(html).toContain("module-reports");
    expect(html).toContain("examinations");
  });
});
