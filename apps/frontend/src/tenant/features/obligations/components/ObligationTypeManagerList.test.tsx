import React, { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { ObligationTypeManagerList } from "./ObligationTypeManagerList";
import type { ObligationType } from "@/lib/data/obligationsData";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const mockTypes: ObligationType[] = [
  {
    id: "type-1",
    name: "Khums Sahm-e-Imam",
    quantity_based: false,
    designated_for: "Syed",
  },
];

const designatedConfig = {
  Syed: { label: "Sayyid Only", cls: "bg-primary" },
  Both: { label: "General", cls: "bg-muted" },
};

const quantityConfig = {
  yes: { label: "Per Item", cls: "bg-info" },
  no: { label: "Lump Sum", cls: "bg-muted" },
};

describe("ObligationTypeManagerList", () => {
  it("renders mobile card with type name and metadata tiles", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ObligationTypeManagerList
          types={mockTypes}
          designatedConfig={designatedConfig}
          quantityConfig={quantityConfig}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("Khums Sahm-e-Imam");
    expect(container.textContent).toContain("obligations.types.colQuantity");
    expect(container.textContent).toContain("obligations.types.colDesignated");
  });

  it("handles edit button click on mobile card", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onEdit = vi.fn();

    await act(async () => {
      root.render(
        <ObligationTypeManagerList
          types={mockTypes}
          designatedConfig={designatedConfig}
          quantityConfig={quantityConfig}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const editBtn = buttons.find((btn) => btn.getAttribute("aria-label")?.includes("editAria"));
    expect(editBtn).toBeDefined();

    await act(async () => {
      editBtn?.click();
    });

    expect(onEdit).toHaveBeenCalledWith(mockTypes[0]);
  });

  it("renders desktop table view when viewMode is table", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ObligationTypeManagerList
          types={mockTypes}
          designatedConfig={designatedConfig}
          quantityConfig={quantityConfig}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          viewMode="table"
        />,
      );
    });

    expect(container.querySelector("table")).toBeDefined();
    expect(container.textContent).toContain("Khums Sahm-e-Imam");
    expect(container.textContent).toContain("obligations.types.colName");
  });
});
