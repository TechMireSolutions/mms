import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi } from "vitest";
import { useDescriptorFilterChips } from "./useDescriptorFilterChips";
import type { EntityDescriptor, FieldDefinition } from "@/types/entityRegistry";

const MOCK_FIELDS: FieldDefinition<Record<string, unknown>>[] = [
  {
    key: "status",
    label: "Status",
    type: "status",
    badgeVariantMap: {
      active: { label: "Active", tone: "success" },
      archived: { label: "Archived", tone: "muted" },
    },
  },
  {
    key: "category",
    label: "Category",
    type: "badge",
    badgeVariantMap: {
      primary: { label: "Primary", tone: "primary" },
      secondary: { label: "Secondary", tone: "secondary" },
    },
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    // no badgeVariantMap — must NOT generate a chip
  },
];

function makeMockDescriptor(): EntityDescriptor<Record<string, unknown>> {
  return {
    entityType: "test",
    singularLabel: "Test Entity",
    pluralLabel: "Test Entities",
    idField: "id",
    titleField: "name",
    fields: MOCK_FIELDS,
    getField: (key) => MOCK_FIELDS.find((f) => f.key === key),
    getTableColumns: () => [],
    getCardFields: () => [],
    getDrawerSections: () => [],
    getRawValue: () => undefined,
    formatFieldValue: () => "",
    renderFieldValue: () => null,
  };
}

function renderHookInDom<R>(
  hookFn: () => R,
): { getResult: () => R; cleanup: () => void } {
  let result!: R;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function Wrapper() {
    result = hookFn();
    return null;
  }

  act(() => {
    root.render(<Wrapper />);
  });

  return {
    getResult: () => result,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("useDescriptorFilterChips", () => {
  it("returns an empty array when no filters are active", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(makeMockDescriptor(), {}, vi.fn()),
    );
    expect(getResult()).toHaveLength(0);
    cleanup();
  });

  it("generates one chip per active badge/status filter", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(
        makeMockDescriptor(),
        { status: "active", category: "primary" },
        vi.fn(),
      ),
    );
    expect(getResult()).toHaveLength(2);
    cleanup();
  });

  it("does NOT generate a chip for text-type fields", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(
        makeMockDescriptor(),
        { name: "Alice", status: "active" },
        vi.fn(),
      ),
    );
    const chips = getResult();
    expect(chips).toHaveLength(1);
    expect(chips[0]?.key).toBe("status");
    cleanup();
  });

  it("uses badgeVariantMap label in chip label text", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(
        makeMockDescriptor(),
        { status: "active" },
        vi.fn(),
      ),
    );
    expect(getResult()[0]?.label).toBe("Status: Active");
    cleanup();
  });

  it("skips null/undefined/empty-string filter values", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(
        makeMockDescriptor(),
        { status: null, category: undefined, name: "" },
        vi.fn(),
      ),
    );
    expect(getResult()).toHaveLength(0);
    cleanup();
  });

  it("calls onRemove with the field key when chip.onRemove is invoked", () => {
    const onRemove = vi.fn();
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(
        makeMockDescriptor(),
        { status: "archived" },
        onRemove,
      ),
    );
    const chips = getResult();
    expect(chips).toHaveLength(1);
    chips[0]?.onRemove();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith("status");
    cleanup();
  });

  it("returns empty array when descriptor is undefined", () => {
    const { getResult, cleanup } = renderHookInDom(() =>
      useDescriptorFilterChips(undefined, { status: "active" }, vi.fn()),
    );
    expect(getResult()).toHaveLength(0);
    cleanup();
  });
});
