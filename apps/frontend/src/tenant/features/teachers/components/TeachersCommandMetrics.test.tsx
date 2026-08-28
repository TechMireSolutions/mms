import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersCommandMetrics } from "./TeachersCommandMetrics";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/teachers/hooks/useTeachers", () => ({
  useTeachersMetrics: () => ({
    data: {
      total: 25,
      active: 20,
      inactive: 5,
      onLeave: 0,
      other: 0,
      newThisPeriod: 2,
    },
  }),
}));

describe("TeachersCommandMetrics Component", () => {
  it("renders metric counters from server metrics and shown count", () => {
    const html = renderToStaticMarkup(<TeachersCommandMetrics total={25} shown={12} />);

    expect(html).toContain("teachers.metrics.total");
    expect(html).toContain("25");
    expect(html).toContain("teachers.metrics.filtered");
    expect(html).toContain("12");
    expect(html).toContain("teachers.metrics.active");
    expect(html).toContain("20");
  });
});
