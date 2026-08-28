import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  useAttendancePaginated,
  useAttendanceRecords,
  useAttendanceRecordsCollection,
  useAttendanceMutations,
  useAttendanceReportAggregates,
  useAttendanceMetrics,
} from "./useAttendance";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: { overallRate: 85 },
    isLoading: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  tsrClient: {
    attendance: {
      list: {
        useQuery: () => ({
          data: {
            body: {
              records: [{ id: "rec-1", studentName: "Bilal" }],
              total: 1,
              page: 1,
              limit: 25,
            },
          },
          isLoading: false,
        }),
      },
      bulk: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      create: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      update: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      delete: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      restore: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      bulkDelete: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      bulkRestore: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
  apiContract: {
    attendance: {
      reportAggregates: vi.fn().mockResolvedValue({ body: {} }),
    },
  },
}));

vi.mock("@/hooks/useServerMetrics", () => ({
  useServerMetrics: () => ({
    data: { totalPresent: 50 },
    isLoading: false,
  }),
}));

describe("useAttendance Hook suite", () => {
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

  it("provides paginated and collection attendance queries and mutations", async () => {
    let paginatedResult: any = null;
    let recordsResult: any = null;
    let collectionResult: any = null;
    let mutationsResult: any = null;
    let reportResult: any = null;
    let metricsResult: any = null;

    function TestComponent() {
      paginatedResult = useAttendancePaginated({ page: 1 });
      recordsResult = useAttendanceRecords();
      collectionResult = useAttendanceRecordsCollection();
      mutationsResult = useAttendanceMutations();
      reportResult = useAttendanceReportAggregates();
      metricsResult = useAttendanceMetrics("2025-01-01");
      return null;
    }

    await act(async () => {
      const root = createRoot(container!);
      root.render(React.createElement(TestComponent));
    });

    expect(paginatedResult.data?.records.length).toBe(1);
    expect(recordsResult.data.length).toBe(1);
    expect(collectionResult.length).toBe(1);
    expect(mutationsResult.createRecord).toBeDefined();
    expect(reportResult.data).toBeDefined();
    expect(metricsResult.data).toBeDefined();
  });
});
