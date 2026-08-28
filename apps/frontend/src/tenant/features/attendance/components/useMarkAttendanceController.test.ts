import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useMarkAttendanceController } from "./useMarkAttendanceController";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useStandardModuleConfig", () => ({
  useAttendanceConfig: () => ({
    statuses: [{ id: "present", label: "Present" }],
    customFields: [],
    orderedFields: [],
    isFieldEnabled: () => true,
  }),
}));

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({
    canWrite: true,
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

describe("useMarkAttendanceController Hook", () => {
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

  it("initializes controller state with filters and records", async () => {
    let hookResult: any = null;

    function TestComponent() {
      hookResult = useMarkAttendanceController({
        filters: { classId: "cls-1", sessionId: "ses-1", teacherId: "", date: "2025-01-01" },
        role: "admin",
        records: [],
        persistBatch: vi.fn(),
      });
      return null;
    }

    await act(async () => {
      const root = createRoot(container!);
      root.render(React.createElement(TestComponent));
    });

    expect(hookResult).toBeDefined();
    expect(hookResult.filters.classId).toBe("cls-1");
    expect(hookResult.filters.date).toBe("2025-01-01");
    expect(hookResult.canWriteAttendance).toBe(true);
  });
});
