import React, { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  seedWidgets: [
    {
      id: "def-card-admin-students",
      title: "",
      category: "students",
      collection: "students",
      widgetType: "card",
      operation: "count",
      role: "admin",
      color: "emerald",
      isPinnedToDashboard: false,
    },
  ],
  widgetsMutate: vi.fn(),
  widgetsMutateAsync: vi.fn(),
  preferencesMutate: vi.fn(),
}));

vi.mock("@/lib/reports/widgetDefaults", () => ({
  getOrInitializeCustomWidgets: () => mocks.seedWidgets,
}));
vi.mock("@/tenant/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: () => true }),
}));
vi.mock("@/tenant/hooks/collections/dashboard", async () => {
  const { DEFAULT_DASHBOARD_PREFERENCES } = await import("@mms/shared");
  return {
    useDashboardPreferencesQuery: () => ({ data: DEFAULT_DASHBOARD_PREFERENCES }),
    useDashboardPreferencesMutation: () => ({ mutate: mocks.preferencesMutate }),
    useDashboardWidgetsQuery: () => ({ data: [], status: "success" }),
    useDashboardWidgetsMutation: () => ({
      mutate: mocks.widgetsMutate,
      mutateAsync: mocks.widgetsMutateAsync,
    }),
    useDashboardWidgetDeleteMutation: () => ({ mutate: vi.fn() }),
    useDashboardWidgetsReorderMutation: () => ({ mutate: vi.fn() }),
  };
});

import { useDashboardConfig } from "./useDashboardConfig";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("useDashboardConfig", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    mocks.widgetsMutate.mockReset();
    mocks.widgetsMutateAsync.mockReset();
    mocks.preferencesMutate.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    queryClient.clear();
  });

  it("seeds an empty server configuration once with a non-empty request body", async () => {
    function Probe(): React.JSX.Element {
      useDashboardConfig();
      return <div />;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe />
          <Probe />
        </QueryClientProvider>,
      );
    });

    expect(mocks.widgetsMutate).toHaveBeenCalledTimes(1);
    expect(mocks.widgetsMutate).toHaveBeenCalledWith(
      { body: mocks.seedWidgets },
      { onError: expect.any(Function) },
    );
  });
});
