import React from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { createEntityDescriptor } from "@/components/common/entityRegistry";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}`, dir: "ltr", language: "en" }),
}));

const descriptor = createEntityDescriptor<Record<string, unknown>>({
  entityType: "demo",
  singularLabel: "Demo",
  pluralLabel: "Demos",
  idField: "id",
  titleField: "id",
  fields: [
    { key: "city", label: "Fallback", labelKey: "demo.city", type: "text" },
  ],
});

describe("FilterChips descriptor labels", () => {
  it("uses labelKey via t for the chip field label", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(
        <FilterChips
          filters={{ city: "Lahore" }}
          descriptor={descriptor}
          onRemoveFilter={() => {}}
          onClearAll={() => {}}
        />,
      );
    });
    expect(container.textContent).toContain("t:demo.city");
    expect(container.textContent).toContain("Lahore");
    container.remove();
  });
});
