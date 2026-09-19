import { describe, expect, it, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useObligationSelection } from "./useObligationSelection";
import type { ObligationCollection } from "@/lib/data/obligationsData";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockCollections: ObligationCollection[] = [
  {
    id: "col-1",
    receipt_no: "REC-001",
    received_date: "2025-01-01",
    sender_id: "c-1",
    amount: 100,
    currency_id: "USD",
    payment_mode: "Cash",
    obligation_type_id: "ot-1",
    mujtahid_representative_id: "rep-1",
    received_by: "u-1",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "col-2",
    receipt_no: "REC-002",
    received_date: "2025-01-02",
    sender_id: "c-2",
    amount: 200,
    currency_id: "USD",
    payment_mode: "Online",
    obligation_type_id: "ot-1",
    mujtahid_representative_id: "rep-1",
    received_by: "u-1",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

describe("useObligationSelection Hook", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      if (container) {
        container.remove();
        container = null;
      }
    };
  });

  it("maintains stable clearSelection reference and handles selections properly", async () => {
    let hookResult: ReturnType<typeof useObligationSelection> | undefined;
    let renderCount = 0;

    function TestComponent({ collections }: { collections: ObligationCollection[] }) {
      renderCount++;
      hookResult = useObligationSelection(collections);
      return null;
    }

    const root = createRoot(container!);
    await act(async () => {
      root.render(React.createElement(TestComponent, { collections: mockCollections }));
    });

    expect(hookResult?.selectedIds).toEqual([]);
    expect(hookResult?.allVisibleSelected).toBe(false);

    const initialClearSelection = hookResult?.clearSelection;

    // Toggle single collection
    await act(async () => {
      hookResult?.toggleSelectedCollection("col-1", true);
    });
    expect(hookResult?.selectedIds).toEqual(["col-1"]);
    expect(hookResult?.someVisibleSelected).toBe(true);
    expect(hookResult?.allVisibleSelected).toBe(false);

    // Verify clearSelection reference did not change
    expect(hookResult?.clearSelection).toBe(initialClearSelection);

    // Select all
    await act(async () => {
      hookResult?.toggleSelectAll(true);
    });
    expect(hookResult?.selectedIds).toEqual(["col-1", "col-2"]);
    expect(hookResult?.allVisibleSelected).toBe(true);

    // Clear selection
    await act(async () => {
      hookResult?.clearSelection();
    });
    expect(hookResult?.selectedIds).toEqual([]);

    // Further clearSelection call when already empty should keep selection empty
    await act(async () => {
      hookResult?.clearSelection();
    });
    expect(hookResult?.selectedIds).toEqual([]);
  });
});
