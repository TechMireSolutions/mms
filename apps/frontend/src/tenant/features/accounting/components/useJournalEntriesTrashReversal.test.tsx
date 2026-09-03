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
  lines: [],
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
  const t = ((key: string) => key) as unknown as Parameters<typeof useJournalEntriesTrashReversal>[0]["t"];

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
});
