import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkDirectoryController } from "./useWorkDirectoryController";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useWorkDirectoryViewMode", () => ({
  useWorkDirectoryViewMode: () => ({
    viewMode: "table",
    setViewMode: vi.fn(),
  }),
}));

describe("useWorkDirectoryController", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  function renderHook() {
    let current!: ReturnType<typeof useWorkDirectoryController>;
    function TestComponent() {
      current = useWorkDirectoryController({ defaultSortField: "name" });
      return null;
    }
    act(() => {
      root.render(<TestComponent />);
    });
    return {
      get current() {
        return current;
      },
    };
  }

  it("initializes with default values", () => {
    const hook = renderHook();
    expect(hook.current.search).toBe("");
    expect(hook.current.page).toBe(1);
    expect(hook.current.viewingDeleted).toBe(false);
    expect(hook.current.sortField).toBe("name");
    expect(hook.current.sortDir).toBe("asc");
    expect(hook.current.selectedIds).toEqual([]);
  });

  it("handles selection operations", () => {
    const hook = renderHook();

    act(() => {
      hook.current.handleSelectOne("id-1");
    });
    expect(hook.current.selectedIds).toEqual(["id-1"]);

    act(() => {
      hook.current.handleSelectAll(["id-1", "id-2"]);
    });
    expect(hook.current.selectedIds).toEqual(["id-1", "id-2"]);

    act(() => {
      hook.current.clearSelection();
    });
    expect(hook.current.selectedIds).toEqual([]);
  });

  it("toggles sort direction when sorting on current field", () => {
    const hook = renderHook();

    act(() => {
      hook.current.handleSort("name");
    });
    expect(hook.current.sortDir).toBe("desc");

    act(() => {
      hook.current.handleSort("email");
    });
    expect(hook.current.sortField).toBe("email");
    expect(hook.current.sortDir).toBe("asc");
  });

  it("manages pendingDelete dialog lifecycle", () => {
    const hook = renderHook();
    expect(hook.current.pendingDelete.open).toBe(false);

    act(() => {
      hook.current.pendingDelete.request("id-99", "Item 99");
    });
    expect(hook.current.pendingDelete.open).toBe(true);
    expect(hook.current.pendingDelete.id).toBe("id-99");
    expect(hook.current.pendingDelete.name).toBe("Item 99");

    act(() => {
      hook.current.pendingDelete.close();
    });
    expect(hook.current.pendingDelete.open).toBe(false);
    expect(hook.current.pendingDelete.id).toBeNull();
  });
});
