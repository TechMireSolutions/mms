import { beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useJournalEntrySelection } from "./useJournalEntrySelection";
import type { JournalEntry } from "@/lib/data/accountingData";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockEntries: JournalEntry[] = [
  {
    id: "entry-1",
    ref: "JE-001",
    date: "2026-09-01",
    description: "Entry 1",
    status: "posted",
    created_by: "u1",
    fiscal_year: "2026",
    tags: [],
    attachments: [],
    lines: [],
  },
  {
    id: "entry-2",
    ref: "JE-002",
    date: "2026-09-02",
    description: "Entry 2",
    status: "draft",
    created_by: "u1",
    fiscal_year: "2026",
    tags: [],
    attachments: [],
    lines: [],
  },
];

describe("useJournalEntrySelection Hook", () => {
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

  it("maintains stable clearSelection reference and correctly manages selection states", async () => {
    let hookResult: ReturnType<typeof useJournalEntrySelection> | undefined;

    function TestComponent({ entries }: { entries: JournalEntry[] }) {
      hookResult = useJournalEntrySelection(entries);
      return null;
    }

    const root = createRoot(container!);
    await act(async () => {
      root.render(React.createElement(TestComponent, { entries: mockEntries }));
    });

    expect(hookResult?.selectedIds).toEqual([]);
    expect(hookResult?.allVisibleSelected).toBe(false);
    expect(hookResult?.someVisibleSelected).toBe(false);

    const initialClearSelection = hookResult?.clearSelection;
    const initialToggleSelectedEntry = hookResult?.toggleSelectedEntry;

    // Toggle single entry on
    await act(async () => {
      hookResult?.toggleSelectedEntry("entry-1", true);
    });
    expect(hookResult?.selectedIds).toEqual(["entry-1"]);
    expect(hookResult?.someVisibleSelected).toBe(true);
    expect(hookResult?.allVisibleSelected).toBe(false);

    // Callbacks remain stable
    expect(hookResult?.clearSelection).toBe(initialClearSelection);
    expect(hookResult?.toggleSelectedEntry).toBe(initialToggleSelectedEntry);

    // Toggle select all on
    await act(async () => {
      hookResult?.toggleSelectAll(true);
    });
    expect(hookResult?.selectedIds).toEqual(["entry-1", "entry-2"]);
    expect(hookResult?.allVisibleSelected).toBe(true);
    expect(hookResult?.someVisibleSelected).toBe(true);

    // Toggle select all off
    await act(async () => {
      hookResult?.toggleSelectAll(false);
    });
    expect(hookResult?.selectedIds).toEqual([]);
    expect(hookResult?.allVisibleSelected).toBe(false);
    expect(hookResult?.someVisibleSelected).toBe(false);

    // Select again and clear via clearSelection
    await act(async () => {
      hookResult?.toggleSelectedEntry("entry-2", true);
    });
    expect(hookResult?.selectedIds).toEqual(["entry-2"]);

    await act(async () => {
      hookResult?.clearSelection();
    });
    expect(hookResult?.selectedIds).toEqual([]);

    // Idempotent clear when already empty preserves identity
    const emptyIdsBefore = hookResult?.selectedIds;
    await act(async () => {
      hookResult?.clearSelection();
    });
    expect(hookResult?.selectedIds).toBe(emptyIdsBefore);

    // No-op toggleSelectedEntry(false) on not-selected item preserves reference
    await act(async () => {
      hookResult?.toggleSelectedEntry("entry-1", false);
    });
    expect(hookResult?.selectedIds).toBe(emptyIdsBefore);

    // Select entry-1
    await act(async () => {
      hookResult?.toggleSelectedEntry("entry-1", true);
    });
    const selectedOneBefore = hookResult?.selectedIds;

    // No-op toggleSelectedEntry(true) on already-selected item preserves reference
    await act(async () => {
      hookResult?.toggleSelectedEntry("entry-1", true);
    });
    expect(hookResult?.selectedIds).toBe(selectedOneBefore);

    // Select all
    await act(async () => {
      hookResult?.toggleSelectAll(true);
    });
    const allSelectedBefore = hookResult?.selectedIds;

    // No-op toggleSelectAll(true) on already all selected preserves reference
    await act(async () => {
      hookResult?.toggleSelectAll(true);
    });
    expect(hookResult?.selectedIds).toBe(allSelectedBefore);
  });
});
