import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyReportsTier } from "./FacultyReportsTier";

vi.mock("@/tenant/features/reports/components/KPISummary", () => ({
  default: ({ category }: { category: string }) => <div data-testid="kpi-summary">KPI: {category}</div>,
}));

vi.mock("@/tenant/features/reports/components/ModuleReports", () => ({
  default: ({ category }: { category: string }) => <div data-testid="module-reports">Reports: {category}</div>,
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("FacultyReportsTier Component", () => {
  it("renders KPI summary and module reports for faculty", () => {
    const html = renderToStaticMarkup(<FacultyReportsTier />);

    expect(html).toContain("KPI: faculty");
    expect(html).toContain("Reports: faculty");
  });
});
