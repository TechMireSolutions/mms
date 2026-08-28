import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAttendanceAnalyticsModel } from "./useAttendanceAnalyticsModel";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useStandardModuleConfig", () => ({
  useAttendanceConfig: () => ({
    statuses: [{ id: "present", label: "Present" }],
  }),
}));

vi.mock("@/lib/contexts/BrandingPaletteContext", () => ({
  useBrandPalette: () => ({
    primary: "#1e40af",
    secondary: "#64748b",
    charts: ["#0284c7", "#0d9488", "#10b981", "#f59e0b"],
  }),
}));

vi.mock("@/tenant/hooks/collections/sessions", () => ({
  useSessionsCollection: () => [],
}));

vi.mock("@/tenant/hooks/collections/enrollments", () => ({
  useEnrollmentsCollection: () => [],
}));

vi.mock("@/tenant/hooks/collections/students", () => ({
  useStudentsByIds: () => ({ data: [] }),
}));

describe("useAttendanceAnalyticsModel Hook", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it("calculates overall rate and pie data", async () => {
    let hookResult: any = null;

    function TestComponent() {
      hookResult = useAttendanceAnalyticsModel({ classId: "cls-1" }, []);
      return null;
    }

    await act(async () => {
      const root = createRoot(container!);
      root.render(React.createElement(TestComponent));
    });

    expect(hookResult).toBeDefined();
    expect(hookResult.overallRate).toBe(0);
    expect(Array.isArray(hookResult.pieData)).toBe(true);
    expect(hookResult.colors.length).toBe(4);
  });
});
