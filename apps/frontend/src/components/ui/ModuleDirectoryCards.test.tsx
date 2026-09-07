import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";

describe("ModuleDirectoryCards Component", () => {
  it("renders non-virtualized cards grid when items count <= 50", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}`, name: `Item ${i}` }));

    const html = renderToStaticMarkup(
      <ModuleDirectoryCards
        items={items}
        selectedIds={[]}
        renderItem={(item) => (
          <div key={item.id} data-testid="card-item">
            {item.name}
          </div>
        )}
      />
    );

    expect(html).toContain("Item 0");
    expect(html).toContain("Item 9");
    expect(html).not.toContain("max-h-[75vh]");
  });

  it("handles high-volume items (> 50) using virtualized windowing container", () => {
    const items = Array.from({ length: 120 }, (_, i) => ({ id: `card-${i}`, name: `Item ${i}` }));

    const html = renderToStaticMarkup(
      <ModuleDirectoryCards
        items={items}
        selectedIds={[]}
        renderItem={(item) => (
          <div key={item.id} data-testid="virtual-card">
            {item.name}
          </div>
        )}
      />
    );

    expect(html).toContain("max-h-[75vh]");
  });

  it("renders select-all bar when onSelectAll is provided and items exist", () => {
    const onSelectAll = vi.fn();
    const items = [{ id: "1", name: "Alpha" }, { id: "2", name: "Beta" }];

    const html = renderToStaticMarkup(
      <ModuleDirectoryCards
        items={items}
        selectedIds={["1"]}
        onSelectAll={onSelectAll}
        allSelected={false}
        someSelected={true}
        selectAllLabel="Select All"
        deselectAllLabel="Deselect"
        checkboxIdPrefix="test-cards"
        renderItem={(item) => <div key={item.id}>{item.name}</div>}
      />
    );

    expect(html).toContain("1 selected");
  });
});
