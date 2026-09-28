import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EditableSelect } from "./EditableSelect";
import { useDropdownListbox } from "./useDropdownListbox";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params && "option" in params) return `Remove ${params.option}`;
      return key;
    },
  }),
}));

describe("EditableSelect", () => {
  it("renders trigger with ARIA listbox attributes", () => {
    const markup = renderToStaticMarkup(
      <EditableSelect
        options={["Father", "Mother"]}
        value="Father"
        onChange={() => {}}
        id="rel-select"
      />,
    );

    expect(markup).toContain('id="rel-select"');
    expect(markup).toContain('aria-haspopup="listbox"');
    expect(markup).toContain('aria-controls="rel-select-listbox"');
    expect(markup).toContain("contacts.options.relationship.father");
  });
});

describe("useDropdownListbox hook keyboard traversal", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    root = null;
  });

  it("cycles through options with ArrowDown and ArrowUp", () => {
    const options = ["Option A", "Option B", "Option C"];
    const onSelect = vi.fn();
    const stateRef: { current: ReturnType<typeof useDropdownListbox> | null } = {
      current: null,
    };

    function TestComponent() {
      stateRef.current = useDropdownListbox({
        options,
        value: "Option A",
        onSelect,
      });
      return null;
    }

    act(() => {
      root?.render(<TestComponent />);
    });

    expect(stateRef.current).not.toBeNull();

    act(() => {
      stateRef.current?.setOpen(true);
    });

    expect(stateRef.current?.open).toBe(true);
    expect(stateRef.current?.highlightedIndex).toBe(0);

    // Arrow down moves to next
    act(() => {
      stateRef.current?.moveHighlight(1);
    });
    expect(stateRef.current?.highlightedIndex).toBe(1);

    // Arrow down moves to next
    act(() => {
      stateRef.current?.moveHighlight(1);
    });
    expect(stateRef.current?.highlightedIndex).toBe(2);

    // Arrow down wraps to start
    act(() => {
      stateRef.current?.moveHighlight(1);
    });
    expect(stateRef.current?.highlightedIndex).toBe(0);

    // Arrow up wraps to end
    act(() => {
      stateRef.current?.moveHighlight(-1);
    });
    expect(stateRef.current?.highlightedIndex).toBe(2);
  });

  it("dispatches selection on Enter key", () => {
    const options = ["Apple", "Banana", "Cherry"];
    const onSelect = vi.fn();
    const stateRef: { current: ReturnType<typeof useDropdownListbox> | null } = {
      current: null,
    };

    function TestComponent() {
      stateRef.current = useDropdownListbox({
        options,
        onSelect,
      });
      return null;
    }

    act(() => {
      root?.render(<TestComponent />);
    });

    act(() => {
      stateRef.current?.setOpen(true);
      stateRef.current?.setHighlightedIndex(1);
    });

    const enterEvent = {
      key: "Enter",
      preventDefault: vi.fn(),
      target: { tagName: "DIV" },
    } as unknown as React.KeyboardEvent<HTMLElement>;

    act(() => {
      stateRef.current?.handleKeyDown(enterEvent);
    });

    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("Banana");
  });
});
