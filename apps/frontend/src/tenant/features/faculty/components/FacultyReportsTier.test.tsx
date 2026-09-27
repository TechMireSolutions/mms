import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersReportsTier } from "./FacultyReportsTier";

vi.mock("@/tenant/features/reports/components/KPISummary", () => ({
  default: ({ category }: { category: string }) => <div data-testid="kpi-summary">KPI: {category}</div>,
}));

vi.mock("@/tenant/features/reports/components/ModuleReports", () => ({
  default: ({ category }: { category: string }) => <div data-testid="module-reports">Reports: {category}</div>,
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TeachersReportsTier Component", () => {
  it("renders KPI summary and module reports for teachers", () => {
    const html = renderToStaticMarkup(<TeachersReportsTier />);

    expect(html).toContain("KPI: teachers");
    expect(html).toContain("Reports: teachers");
  });
});
