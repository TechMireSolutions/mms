import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJournalEntriesTrashReversal } from "./useJournalEntriesTrashReversal";
import type { JournalEntry } from "@/lib/data/accountingData";
import { notify } from "@/lib/notify";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/notify", () => ({
  notify: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEntryDraft: JournalEntry = {
  id: "entry-1",
  ref: "JE-001",
  date: "2026-09-01",
  description: "Draft entry",
  status: "draft",
  created_by: "user-1",
  fiscal_year: "2026",
  tags: [],
  attachments: [],
  lines: [],
};

const mockEntryPosted: JournalEntry = {
  id: "entry-2",
  ref: "JE-002",
  date: "2026-09-01",
  description: "Posted entry",
  status: "posted",
  created_by: "user-1",
  fiscal_year: "2026",
  tags: [],
  attachments: [],
  lines: [
    { id: "l1", account_id: "a1000", debit: 100, credit: 0, description: "" },
    { id: "l2", account_id: "a4000", debit: 0, credit: 100, description: "" },
  ],
};

/** An entry that already reverses `mockEntryPosted`. */
const mockReversalOfPosted: JournalEntry = {
  id: "entry-3",
  ref: "REV-JE-002-1",
  date: "2026-09-02",
  description: "Reversal of Entry JE-002",
  status: "posted",
  created_by: "System",
  fiscal_year: "2026",
  tags: ["Reversal"],
  attachments: [],
  lines: [
    { id: "l3", account_id: "a1000", debit: 0, credit: 100, description: "" },
    { id: "l4", account_id: "a4000", debit: 100, credit: 0, description: "" },
  ],
  reversed_ref: "JE-002",
};

function TestHarness(props: Parameters<typeof useJournalEntriesTrashReversal>[0] & {
  onController: (c: ReturnType<typeof useJournalEntriesTrashReversal>) => void;
}) {
  const controller = useJournalEntriesTrashReversal(props);
  props.onController(controller);
  return null;
}

describe("useJournalEntriesTrashReversal", () => {
  let container: HTMLDivElement;
  let root: Root;
  const t = ((key: string, args?: Record<string, string | number>) =>
    args ? `${key}|${JSON.stringify(args)}` : key) as unknown as Parameters<typeof useJournalEntriesTrashReversal>[0]["t"];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("warns and blocks deletion if journal entry is already posted", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestRowTrash("entry-2");
    });

    expect(notify.warning).toHaveBeenCalled();
    expect(controller.pendingTrashId).toBeNull();
  });

  it("sets pendingTrashId and calls onDelete upon confirmRowTrash for draft entry", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onDelete = vi.fn();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryDraft]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          onDelete={onDelete}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestRowTrash("entry-1");
    });

    expect(controller.pendingTrashId).toBe("entry-1");

    act(() => {
      controller.confirmRowTrash();
    });

    expect(onDelete).toHaveBeenCalledWith("entry-1");
    expect(controller.pendingTrashId).toBeNull();
  });

  it("handles bulk delete and restore actions", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onBulkDelete = vi.fn();
    const setSelectedIds = vi.fn();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryDraft]}
          showDeleted={false}
          selectedIds={["entry-1"]}
          setSelectedIds={setSelectedIds}
          onBulkDelete={onBulkDelete}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestBulkTrash();
    });

    expect(controller.confirmBulkOpen).toBe(true);

    act(() => {
      controller.confirmBulkTrash();
    });

    expect(onBulkDelete).toHaveBeenCalledWith(["entry-1"]);
    expect(setSelectedIds).toHaveBeenCalledWith([]);
    expect(controller.confirmBulkOpen).toBe(false);
  });

  it("filters posted ids out of a bulk archive and names the immutable rows", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onBulkDelete = vi.fn();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryDraft, mockEntryPosted]}
          showDeleted={false}
          selectedIds={["entry-1", "entry-2"]}
          setSelectedIds={vi.fn()}
          onBulkDelete={onBulkDelete}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestBulkTrash();
    });

    expect(notify.warning).toHaveBeenCalledWith(
      expect.stringContaining("accounting.journal.alerts.bulkPostedBlocked"),
    );
    expect(String(vi.mocked(notify.warning).mock.calls[0]?.[0])).toContain("JE-002");
    expect(controller.confirmBulkOpen).toBe(true);

    act(() => {
      controller.confirmBulkTrash();
    });

    // The posted row never reaches the API, so the generic partial-failure count
    // is replaced by a per-row explanation.
    expect(onBulkDelete).toHaveBeenCalledWith(["entry-1"]);
  });

  it("does not open the bulk confirm dialog when every selected row is posted", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onBulkDelete = vi.fn();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted]}
          showDeleted={false}
          selectedIds={["entry-2"]}
          setSelectedIds={vi.fn()}
          onBulkDelete={onBulkDelete}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestBulkTrash();
    });

    expect(controller.confirmBulkOpen).toBe(false);
    expect(onBulkDelete).not.toHaveBeenCalled();
  });

  it("posts the reversal entry and names its reference in the success toast", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onChange = vi.fn<
      (entries: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => void
    >();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          onChange={onChange}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestReverse(mockEntryPosted);
    });
    expect(controller.pendingReverseEntry?.id).toBe("entry-2");

    await act(async () => {
      await controller.confirmReverse();
    });

    const updater = onChange.mock.calls[0]?.[0] as
      | ((prev: JournalEntry[]) => JournalEntry[])
      | undefined;
    expect(updater).toBeTypeOf("function");
    const next = updater!([mockEntryPosted]);
    const reversal = next[1];
    // Posted, not a draft: every ledger/report view counts posted rows only.
    expect(reversal.status).toBe("posted");
    expect(reversal.reversed_ref).toBe("JE-002");
    expect(reversal.source_type).toBe("reversal");
    expect(notify.success).toHaveBeenCalledWith(
      expect.stringContaining("accounting.journal.alerts.reversalPosted"),
    );
    expect(String(vi.mocked(notify.success).mock.calls[0]?.[0])).toContain(reversal.ref);
    expect(controller.pendingReverseEntry).toBeNull();
  });

  it("creates only one reversal when the confirmation fires twice", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onChange = vi.fn<
      (entries: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => void
    >();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          onChange={onChange}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestReverse(mockEntryPosted);
    });

    await act(async () => {
      await Promise.all([controller.confirmReverse(), controller.confirmReverse()]);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(notify.success).toHaveBeenCalledTimes(1);
  });

  it("refuses to reverse an entry that already has a reversal", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted, mockReversalOfPosted]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          onChange={onChange}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestReverse(mockEntryPosted);
    });

    expect(notify.warning).toHaveBeenCalledWith(
      expect.stringContaining("accounting.journal.alerts.alreadyReversed"),
    );
    expect(controller.pendingReverseEntry).toBeNull();

    await act(async () => {
      await controller.confirmReverse();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the server validation message when the reversal write is refused", async () => {
    let controller!: ReturnType<typeof useJournalEntriesTrashReversal>;
    // ts-rest hooks reject with the raw result object, not an Error.
    const onChange = vi.fn().mockRejectedValue({
      status: 422,
      body: {
        type: "validation_error",
        message: "The fiscal year containing 2026-09-01 is closed",
      },
      headers: new Headers(),
    });

    await act(async () => {
      root.render(
        <TestHarness
          entries={[mockEntryPosted]}
          showDeleted={false}
          selectedIds={[]}
          setSelectedIds={vi.fn()}
          onChange={onChange}
          t={t}
          onController={(c) => {
            controller = c;
          }}
        />,
      );
    });

    act(() => {
      controller.requestReverse(mockEntryPosted);
    });

    await act(async () => {
      await controller.confirmReverse();
    });

    const [title, options] = vi.mocked(notify.error).mock.calls[0] ?? [];
    expect(String(title)).toContain("accounting.journal.alerts.reverseFailed");
    expect(options?.description).toBe("The fiscal year containing 2026-09-01 is closed");
    expect(options?.description).not.toBe("[object Object]");
  });
});
