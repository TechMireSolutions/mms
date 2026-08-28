import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { useEnrollmentsSelection } from "./useEnrollmentsSelection";
import type { Enrollment } from "@/lib/data/enrollmentData";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockEnrollments: Enrollment[] = [
  { id: "enr-1" } as Enrollment,
  { id: "enr-2" } as Enrollment,
];

let hookResult: ReturnType<typeof useEnrollmentsSelection> | null = null;

function TestComponent(): React.JSX.Element {
  hookResult = useEnrollmentsSelection(mockEnrollments);
  return React.createElement("div");
}

describe("useEnrollmentsSelection hook", () => {
  it("manages selection state correctly", async () => {
    const root = createRoot(document.createElement("div"));
    await act(async () => {
      root.render(React.createElement(TestComponent));
    });

    expect(hookResult?.selectedIds).toEqual([]);
    expect(hookResult?.allVisibleSelected).toBe(false);

    await act(async () => {
      hookResult?.toggleSelectedEnrollment("enr-1", true);
    });

    expect(hookResult?.selectedIds).toEqual(["enr-1"]);
    expect(hookResult?.someVisibleSelected).toBe(true);

    await act(async () => {
      hookResult?.toggleSelectAll(true);
    });

    expect(hookResult?.selectedIds).toEqual(["enr-1", "enr-2"]);
    expect(hookResult?.allVisibleSelected).toBe(true);

    await act(async () => {
      hookResult?.clearSelection();
    });

    expect(hookResult?.selectedIds).toEqual([]);

    await act(async () => {
      root.unmount();
    });
  });
});
