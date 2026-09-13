import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvoiceTemplateEditor } from "./InvoiceTemplateEditor";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/hooks/useBranding", () => ({
  useBranding: () => ({
    logoUrl: null,
  }),
}));

vi.mock("@/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("InvoiceTemplateEditor", () => {
  it("renders the obligations invoice template editor with localized title", () => {
    const html = renderToStaticMarkup(<InvoiceTemplateEditor onClose={vi.fn()} />);

    expect(html).toContain("obligations.templateEditorTitle");
  });
});
