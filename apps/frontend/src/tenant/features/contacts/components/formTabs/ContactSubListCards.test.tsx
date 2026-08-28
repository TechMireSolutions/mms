import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Plus } from "lucide-react";
import {
  ListFieldCard,
  ContactSubListShell,
  resolveSubListAllowAdd,
} from "./ContactSubListCards";

vi.mock("@/components/ui/FormPrimitives", () => ({
  CardRemoveButton: ({ label }: { label: string }) => <button data-testid="remove-btn">{label}</button>,
}));

vi.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

describe("ContactSubListCards Components", () => {
  it("resolveSubListAllowAdd calculates allowAdd correctly", () => {
    expect(resolveSubListAllowAdd([false, false], 0)).toBe(false);
    expect(resolveSubListAllowAdd([false, true], 0)).toBe(true);
    expect(resolveSubListAllowAdd([false, false], 1)).toBe(true);
  });

  it("renders ListFieldCard with header", () => {
    const html = renderToStaticMarkup(
      <ListFieldCard
        id="card-1"
        index={0}
        label="Type:"
        typeSelect={<span>Select</span>}
        onRemove={vi.fn()}
        removeLabel="Remove item"
      >
        <div>Content</div>
      </ListFieldCard>,
    );

    expect(html).toContain("Type:");
    expect(html).toContain("Select");
    expect(html).toContain("Content");
  });

  it("renders ContactSubListShell when empty", () => {
    const html = renderToStaticMarkup(
      <ContactSubListShell
        isEmpty={true}
        emptyIcon={Plus}
        emptyMessage="No items yet"
        addLabel="Add Item"
        onAdd={vi.fn()}
        onEnsureRow={vi.fn()}
      >
        <div>Children</div>
      </ContactSubListShell>,
    );

    expect(html).toContain("No items yet");
    expect(html).toContain("Add Item");
  });
});
