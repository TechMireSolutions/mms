import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EditableSelect } from "./EditableSelect";

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
      />
    );

    expect(markup).toContain('id="rel-select"');
    expect(markup).toContain('aria-haspopup="listbox"');
    expect(markup).toContain('aria-controls="rel-select-listbox"');
    expect(markup).toContain("contacts.options.relationship.father");
  });
});
