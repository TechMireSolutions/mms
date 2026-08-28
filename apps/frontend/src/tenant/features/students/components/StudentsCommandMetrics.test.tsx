import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentsCommandMetrics } from "./StudentsCommandMetrics";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/students/hooks/useStudents", () => ({
  useStudentsMetrics: () => ({
    data: {
      total: 100,
      active: 85,
      inactive: 15,
      suspended: 0,
      newThisPeriod: 5,
    },
  }),
}));

describe("StudentsCommandMetrics Component", () => {
  it("renders metric counters from server metrics and shown count", () => {
    const html = renderToStaticMarkup(<StudentsCommandMetrics total={100} shown={42} />);

    expect(html).toContain("students.metrics.total");
    expect(html).toContain("100");
    expect(html).toContain("students.metrics.filtered");
    expect(html).toContain("42");
    expect(html).toContain("students.metrics.active");
    expect(html).toContain("85");
  });
});
