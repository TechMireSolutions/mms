import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentsReportsTier } from "./EnrollmentsReportsTier";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/enrollments/hooks/useEnrollmentsApi", () => ({
  useEnrollmentsReportAggregates: () => ({
    data: { status: 200, body: {} },
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/components/ui/reports/KPISummary", () => ({
  default: ({ category }: { category: string }) => (
    <div data-testid="kpi-summary">KPI Summary: {category}</div>
  ),
}));

vi.mock("@/tenant/features/enrollments/components/EnrollmentReports", () => ({
  EnrollmentReports: () => <div data-testid="enrollment-reports">Enrollment Reports</div>,
}));

describe("EnrollmentsReportsTier Component", () => {
  it("renders KPISummary and EnrollmentReports", () => {
    const html = renderToStaticMarkup(<EnrollmentsReportsTier />);
    expect(html).toContain("KPI Summary: enrollments");
    expect(html).toContain("Enrollment Reports");
  });
});
